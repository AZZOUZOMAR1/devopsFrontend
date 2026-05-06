import { Component, ElementRef, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FaceRecognitionService } from '../../services/face-recognition.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements AfterViewInit, OnDestroy {
  @ViewChild('faceVideo') faceVideoRef?: ElementRef<HTMLVideoElement>;

  signInData = {
    email: '',
    password: ''
  };
  hidePassword = true;
  rememberMe = false;
  isSubmitting = false;
  signinError = '';
  oauthError = '';

  showFaceLogin = false;
  faceStream: MediaStream | null = null;
  faceCameraError = '';
  faceLoginError = '';
  isFaceSubmitting = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private faceRecognition: FaceRecognitionService
  ) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.initGoogleButton();
  }

  ngOnDestroy(): void {
    this.stopFaceCamera();
  }

  toggleFaceLogin(): void {
    this.showFaceLogin = !this.showFaceLogin;
    this.faceLoginError = '';
    if (!this.showFaceLogin) {
      this.stopFaceCamera();
    }
  }

  isFormValid(): boolean {
    return this.signInData.email.trim() !== '' &&
           this.signInData.password.trim() !== '' &&
           this.isValidEmail(this.signInData.email);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSignIn() {
    if (!this.isFormValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.signinError = '';

    this.authService.signin(this.signInData).subscribe({
      next: (user) => {
        this.navigateAfterLogin(user.role);
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Signin failed', err);
        this.isSubmitting = false;
        this.signinError = err?.error?.message || err?.message || 'Identifiants incorrects ou compte bloqué.';
      }
    });
  }

  async startFaceCamera(): Promise<void> {
    this.faceCameraError = '';
    this.faceLoginError = '';
    if (!this.faceRecognition.isAvailableInThisContext()) {
      this.faceCameraError = 'La caméra et les modèles de visage nécessitent HTTPS ou localhost.';
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.faceCameraError = 'Votre navigateur ne permet pas l\'accès à la caméra.';
      return;
    }
    try {
      this.faceStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setTimeout(() => {
        const video = this.faceVideoRef?.nativeElement;
        if (video && this.faceStream) {
          video.srcObject = this.faceStream;
          void video.play();
        }
      }, 100);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        this.faceCameraError = 'Accès à la caméra refusé.';
      } else {
        this.faceCameraError = 'Impossible d\'ouvrir la caméra.';
      }
    }
  }

  stopFaceCamera(): void {
    if (this.faceStream) {
      this.faceStream.getTracks().forEach(t => t.stop());
      this.faceStream = null;
    }
    const video = this.faceVideoRef?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  async onFaceSignIn(): Promise<void> {
    if (this.isFaceSubmitting) {
      return;
    }
    const video = this.faceVideoRef?.nativeElement;
    if (!video || !this.faceStream) {
      this.faceLoginError = 'Démarrez la caméra puis réessayez.';
      return;
    }
    this.isFaceSubmitting = true;
    this.faceLoginError = '';
    try {
      const descriptor = await this.faceRecognition.extractDescriptorFromVideo(video);
      if (!descriptor || descriptor.length !== 128) {
        this.faceLoginError = 'Aucun visage détecté. Centrez votre visage, améliorez la lumière, puis réessayez.';
        this.isFaceSubmitting = false;
        return;
      }
      this.authService.signinFaceOnly({ faceDescriptor: descriptor }).subscribe({
        next: (user) => {
          this.stopFaceCamera();
          this.navigateAfterLogin(user.role);
          this.isFaceSubmitting = false;
        },
        error: (err) => {
          console.error('Face signin failed', err);
          this.isFaceSubmitting = false;
          this.faceLoginError = err?.error?.message || err?.message || 'Connexion par visage impossible.';
        }
      });
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : '';
      this.faceLoginError = msg
        ? `Analyse du visage : ${msg}`
        : 'Erreur lors de l\'analyse du visage. Vérifiez la console (F12), attendez que l’image caméra soit visible, puis réessayez.';
      this.isFaceSubmitting = false;
    }
  }

  private navigateAfterLogin(role: string): void {
    if (role === 'ADMIN' || role === 'CLUB_MANAGER' || role === 'TUTOR') {
      this.router.navigate(['/backoffice/users']);
    } else {
      this.router.navigate(['/frontoffice/dashboard']);
    }
  }

  private initGoogleButton(retries: number = 10): void {
    this.oauthError = '';
    const clientId = '644502813482-7uk5q7lh9f6a5eu920mutgrr4ooe3n5g.apps.googleusercontent.com';

    // @ts-ignore - global google object from Google Identity Services
    const google = (window as any).google;
    if (!google || !google.accounts || !google.accounts.id) {
      if (retries > 0) {
        setTimeout(() => this.initGoogleButton(retries - 1), 500);
      } else {
        this.oauthError = 'Google Sign-In n\'est pas disponible. Vérifiez votre connexion internet.';
      }
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => this.handleGoogleResponse(response)
    });

    const button = document.getElementById('google-signin-button');
    if (button) {
      google.accounts.id.renderButton(button, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'continue_with'
      });
    }
  }

  private handleGoogleResponse(response: any): void {
    const idToken = response?.credential;
    if (!idToken) {
      this.oauthError = 'Impossible de récupérer le jeton Google.';
      return;
    }
    this.isSubmitting = true;
    this.authService.googleSignin(idToken).subscribe({
      next: (user) => {
        this.navigateAfterLogin(user.role);
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Google signin failed', err);
        this.isSubmitting = false;
        this.oauthError = err?.error?.message || 'Connexion Google impossible. Essayez avec votre email/mot de passe.';
      }
    });
  }

  onFacebookSignIn(): void {
    this.oauthError = '';
    if (typeof window === 'undefined') {
      this.oauthError = 'Facebook Sign-In n\'est pas disponible dans ce contexte.';
      return;
    }

    // @ts-ignore - global FB object from Facebook SDK
    const FB = (window as any).FB;
    if (!FB) {
      this.oauthError = 'Facebook SDK non chargé. Vérifiez votre connexion internet.';
      return;
    }

    FB.init({
      appId: '1551855115903856',
      cookie: true,
      xfbml: false,
      version: 'v18.0'
    });

    FB.login((response: any) => {
      if (!response || response.status !== 'connected') {
        this.oauthError = 'Connexion Facebook annulée ou échouée.';
        return;
      }
      const accessToken = response.authResponse?.accessToken;
      if (!accessToken) {
        this.oauthError = 'Impossible de récupérer le jeton Facebook.';
        return;
      }

      this.isSubmitting = true;
      this.authService.facebookSignin(accessToken).subscribe({
        next: (user) => {
          this.navigateAfterLogin(user.role);
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Facebook signin failed', err);
          this.isSubmitting = false;
          this.oauthError = err?.error?.message || 'Connexion Facebook impossible. Essayez avec votre email/mot de passe.';
        }
      });
    }, { scope: 'email,public_profile' });
  }
}
