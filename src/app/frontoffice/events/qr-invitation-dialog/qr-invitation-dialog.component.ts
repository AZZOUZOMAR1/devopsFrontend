import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-invitation-dialog',
  templateUrl: './qr-invitation-dialog.component.html',
  styleUrls: ['./qr-invitation-dialog.component.css']
})
export class QrInvitationDialogComponent {
  qrDataUrl: string | null = null;
  invitationUrl: string;

  constructor(
    public dialogRef: MatDialogRef<QrInvitationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { inscriptionId: number; titreEvenement: string }
  ) {
    this.invitationUrl = `${window.location.origin}/invitation/${data.inscriptionId}`;
    QRCode.toDataURL(this.invitationUrl, { width: 256, margin: 2 }).then(
      (url) => (this.qrDataUrl = url)
    ).catch(() => {});
  }

  close(): void {
    this.dialogRef.close();
  }
}
