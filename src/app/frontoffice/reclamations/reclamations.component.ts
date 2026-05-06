import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReclamationListSyncService } from '../../services/reclamation-list-sync.service';
import { Reclamation, ReclamationService, StudentBlockStatus } from '../../services/reclamation.service';
import { ReclamationResolutionNotifyService } from '../../services/reclamation-resolution-notify.service';
import { StudentReclamationBlockStatusService } from '../../services/student-reclamation-block-status.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reclamations',
  templateUrl: './reclamations.component.html',
  styleUrls: ['./reclamations.component.css']
})
export class ReclamationsComponent implements OnInit, OnDestroy {
  reclamations: Reclamation[] = [];
  formModel: Reclamation = {
    sujet: '',
    description: ''
  };
  studentId: number | null = null;
  loading = false;
  errorMessage = '';
  /** Shown when GET /reclamations?studentId=… fails (create may still succeed). */
  listLoadError = '';
  successMessage = '';
  isStudentBlocked = false;
  /** Short explanation shown in the block notice (no raw API concatenation). */
  blockMainText = '';
  /** Formatted date/time when the block ends, for display only. */
  blockedUntilDisplay: string | null = null;
  isRecording = false;
  recordingField: 'sujet' | 'description' = 'description';
  speechSupported = false;
  private recognition: any | null = null;
  private blockStatusSub: Subscription | null = null;
  showChatbot = false;
  isChatbotLoading = false;
  chatbotInput = '';
  /** Row from last successful POST until the GET list contains the same id (avoids empty UI if GET lags or mismatches). */
  private pendingCreatedRow: Reclamation | null = null;
  chatbotMessages: Array<{ role: 'bot' | 'user'; text: string }> = [
    {
      role: 'bot',
      text: 'Hi! I am your Reclamation Assistant. Tell me your issue and I can help you write a clear complaint.'
    }
  ];

  constructor(
    private reclamationService: ReclamationService,
    private authService: AuthService,
    private reclamationListSync: ReclamationListSyncService,
    private resolutionNotify: ReclamationResolutionNotifyService,
    private reclamationBlockStatus: StudentReclamationBlockStatusService
  ) {}

  private resolveStudentId(user: { id?: unknown }): number | null {
    const n = Number(user?.id);
    if (!Number.isFinite(n) || n < 1) {
      return null;
    }
    return Math.floor(n);
  }

  private isStudentRole(role: string | undefined): boolean {
    return String(role ?? '').toUpperCase() === 'STUDENT';
  }

  /** Merge last created row into server list so the table never flashes empty after a successful POST. */
  private mergePendingIntoServerList(server: Reclamation[]): Reclamation[] {
    const p = this.pendingCreatedRow;
    if (!p) {
      return server;
    }
    if (p.id != null && server.some((r) => r.id === p.id)) {
      this.pendingCreatedRow = null;
      return server;
    }
    const sameContent = server.some(
      (r) =>
        (p.studentId == null || r.studentId === p.studentId) &&
        r.sujet === p.sujet &&
        r.description === p.description
    );
    if (sameContent) {
      this.pendingCreatedRow = null;
      return server;
    }
    if (p.id != null) {
      return [p, ...server.filter((r) => r.id !== p.id)];
    }
    return [p, ...server];
  }

  private mergeCreatedFromResponse(
    created: Reclamation | null | undefined,
    payload: Reclamation
  ): Reclamation {
    const c = created && typeof created === 'object' ? created : ({} as Reclamation);
    const hasBody = c.id != null || (typeof c.sujet === 'string' && c.sujet.length > 0);
    if (hasBody) {
      return { ...payload, ...c };
    }
    return { ...payload, statut: c.statut || 'EN_ATTENTE' };
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.isStudentRole(currentUser.role)) {
      this.errorMessage = 'This page is only available for students.';
      return;
    }
    this.pendingCreatedRow = null;
    this.studentId = this.resolveStudentId(currentUser);
    if (this.studentId == null) {
      this.errorMessage = 'Your account has no valid student id. Please sign in again.';
      return;
    }
    this.loadMyReclamations();
    this.initVoiceRecognition();
    this.blockStatusSub = this.reclamationBlockStatus.status$.subscribe((status) => {
      if (status == null || !status.blocked) {
        this.isStudentBlocked = false;
        this.blockMainText = '';
        this.blockedUntilDisplay = null;
        return;
      }
      this.applyBlockStatus(status);
    });
    this.reclamationBlockStatus.refresh(this.studentId);
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.blockStatusSub?.unsubscribe();
    this.blockStatusSub = null;
  }

  /**
   * @param silent When true, does not toggle the full-page list loading state (keeps the table visible after create).
   */
  loadMyReclamations(silent = false): void {
    if (!this.studentId) return;
    if (!silent) {
      this.loading = true;
      this.listLoadError = '';
    }
    this.reclamationService.getByStudent(this.studentId).subscribe({
      next: (list) => {
        this.reclamations = this.mergePendingIntoServerList(list);
        this.loading = false;
        this.listLoadError = '';
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        const detail =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message || err?.message || '';
        this.listLoadError =
          'Could not refresh your reclamation list' +
          (status != null ? ` (HTTP ${status}).` : '.') +
          (detail ? ` ${detail}` : ' Check the network tab or try again.');
      }
    });
  }

  /** Spring/Jackson may send `createdAt` as ISO string or as an array — keep the table usable in both cases. */
  formatCreatedAt(r: Reclamation): string {
    const v = r.createdAt as unknown;
    if (v == null || v === '') {
      return '-';
    }
    if (typeof v === 'string' || typeof v === 'number') {
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
    }
    if (Array.isArray(v) && v.length >= 3) {
      const y = Number(v[0]);
      const mo = Number(v[1]);
      const day = Number(v[2]);
      const h = v.length > 3 ? Number(v[3]) : 0;
      const mi = v.length > 4 ? Number(v[4]) : 0;
      const sec = v.length > 5 ? Number(v[5]) : 0;
      return new Date(y, mo - 1, day, h, mi, sec).toLocaleString();
    }
    return '-';
  }

  refreshList(): void {
    this.loadMyReclamations(false);
  }

  submit(): void {
    if (!this.studentId) return;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isStudentBlocked) {
      return;
    }

    if (!this.formModel.sujet?.trim() || !this.formModel.description?.trim()) {
      this.errorMessage = 'Subject and description are required.';
      return;
    }

    const payload: Reclamation = {
      sujet: this.formModel.sujet.trim(),
      description: this.formModel.description.trim(),
      studentId: this.studentId
    };

    this.reclamationService.create(payload).subscribe({
      next: (created) => {
        this.successMessage = 'Reclamation created successfully.';
        const merged = this.mergeCreatedFromResponse(created, payload);
        this.pendingCreatedRow = merged;
        this.resolutionNotify.emitAutoResolved(merged);
        this.resetForm();
        this.reclamations = this.mergePendingIntoServerList(this.reclamations);
        this.listLoadError = '';
        this.loadMyReclamations(true);
        this.reclamationListSync.notifyListChanged();
      },
      error: (err) => {
        const msg = err?.error?.message || 'An error occurred while creating the reclamation.';
        if (!this.studentId) {
          this.errorMessage = msg;
          return;
        }
        this.reclamationBlockStatus.fetchNow(this.studentId).subscribe({
          next: (status) => {
            if (status.blocked) {
              this.errorMessage = '';
            } else {
              this.errorMessage = msg;
            }
          },
          error: () => {
            this.errorMessage = msg;
          }
        });
      }
    });
  }

  resetForm(): void {
    this.formModel = {
      sujet: '',
      description: ''
    };
  }

  getStatusLabel(status?: string): string {
    if (status === 'RESOLUE') return 'Processed';
    if (status === 'EN_COURS' || status === 'IN_PROGRESS') return 'In Progress';
    return 'Pending';
  }

  getStatusClass(status?: string): string {
    if (status === 'RESOLUE') return 'status-processed';
    if (status === 'EN_COURS' || status === 'IN_PROGRESS') return 'status-progress';
    return 'status-pending';
  }

  private initVoiceRecognition(): void {
    const browserWindow = window as any;
    const SpeechRecognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.speechSupported = false;
      return;
    }

    this.speechSupported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      const clean = transcript.trim();
      if (!clean) return;

      if (this.recordingField === 'sujet') {
        this.formModel.sujet = `${this.formModel.sujet} ${clean}`.trim();
      } else {
        this.formModel.description = `${this.formModel.description} ${clean}`.trim();
      }
    };

    this.recognition.onerror = () => {
      this.isRecording = false;
      this.errorMessage = 'Voice recognition failed. Please try again.';
    };

    this.recognition.onend = () => {
      this.isRecording = false;
    };
  }

  toggleVoiceInput(field: 'sujet' | 'description'): void {
    if (!this.speechSupported || !this.recognition) {
      this.errorMessage = 'Voice input is not supported in this browser.';
      return;
    }

    this.errorMessage = '';
    if (this.isRecording) {
      this.recognition.stop();
      return;
    }

    this.recordingField = field;
    this.isRecording = true;
    this.recognition.start();
  }

  toggleChatbot(): void {
    this.showChatbot = !this.showChatbot;
  }

  useQuickPrompt(type: 'access' | 'payment' | 'bug' | 'other'): void {
    const templates: Record<string, { sujet: string; description: string; prompt: string }> = {
      access: {
        sujet: 'Access problem',
        description: 'I cannot access my account/course. Please verify my access rights and restore access.',
        prompt: 'I cannot access my account.'
      },
      payment: {
        sujet: 'Payment issue',
        description: 'I completed the payment but my access is still blocked. Please verify my payment status.',
        prompt: 'I paid but still no access.'
      },
      bug: {
        sujet: 'Platform bug report',
        description: 'I encountered a technical issue on the platform. Please investigate and fix it.',
        prompt: 'I found a bug on the platform.'
      },
      other: {
        sujet: 'General complaint',
        description: 'I want to report an issue and request support from the admin team.',
        prompt: 'I need help with another issue.'
      }
    };
    const tpl = templates[type];
    this.formModel.sujet = tpl.sujet;
    this.formModel.description = tpl.description;
    this.chatbotMessages.push({ role: 'user', text: tpl.prompt });
    this.chatbotMessages.push({ role: 'bot', text: 'Done. I pre-filled your form. You can edit it and submit.' });
    this.showChatbot = true;
  }

  sendChatbotMessage(): void {
    const text = this.chatbotInput.trim();
    if (!text) return;
    this.chatbotMessages.push({ role: 'user', text });
    this.chatbotInput = '';
    this.isChatbotLoading = true;

    this.reclamationService.assistWithChatbot({
      message: text,
      sujet: this.formModel.sujet,
      description: this.formModel.description
    }).subscribe({
      next: (res) => {
        if (res.suggestedSubject && !this.formModel.sujet.trim()) {
          this.formModel.sujet = res.suggestedSubject;
        }
        if (res.suggestedDescription && !this.formModel.description.trim()) {
          this.formModel.description = res.suggestedDescription;
        }
        this.chatbotMessages.push({
          role: 'bot',
          text: res.reply || 'I updated your complaint draft.'
        });
        this.isChatbotLoading = false;
      },
      error: () => {
        this.chatbotMessages.push({
          role: 'bot',
          text: 'AI service is currently unavailable. I kept your message; please continue editing manually.'
        });
        this.isChatbotLoading = false;
      }
    });
  }

  private applyBlockStatus(status: StudentBlockStatus): void {
    this.isStudentBlocked = true;
    this.errorMessage = '';
    const defaultReason =
      'You were reported because of inappropriate language. Creating new reclamations is disabled for 3 days. Please contact the administration if you need assistance.';
    const rawReason = (status.reason || '').trim();
    this.blockMainText =
      rawReason && rawReason.length > 0 && !this.isGenericBlockReason(rawReason)
        ? rawReason
        : defaultReason;
    this.blockedUntilDisplay = status.blockedUntil
      ? new Date(status.blockedUntil).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : null;
  }

  /** Treats long backend default copy as generic so we show friendlier UI text. */
  private isGenericBlockReason(text: string): boolean {
    return (
      text.includes('cannot create a new reclamation for 3 days') ||
      text.includes('consult the administration')
    );
  }

}
