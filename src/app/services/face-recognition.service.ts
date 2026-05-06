import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Les fichiers `weights/` ne sont pas dans le paquet npm (d’où 404 sur …/npm/face-api.js/…).
 * Ils sont servis depuis le dépôt officiel (même contenu que le tag 0.22.2).
 */
const MODELS_BASE_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private readonly platformId = inject(PLATFORM_ID);
  private modelsReady = false;
  private loadingModels: Promise<void> | null = null;

  isAvailableInThisContext(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    if (typeof window === 'undefined') {
      return false;
    }
    return window.isSecureContext === true;
  }

  /**
   * Attend que la vidéo ait des dimensions non nulles (sinon face-api lève une erreur sur les pixels).
   */
  private waitForVideoFrame(video: HTMLVideoElement, timeoutMs = 8000): Promise<boolean> {
    const ok = (): boolean =>
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0;

    if (ok()) {
      return Promise.resolve(true);
    }
    return new Promise(resolve => {
      const onCheck = (): void => {
        if (ok()) {
          cleanup();
          resolve(true);
        }
      };
      const cleanup = (): void => {
        clearTimeout(timer);
        video.removeEventListener('loadeddata', onCheck);
        video.removeEventListener('playing', onCheck);
        video.removeEventListener('canplay', onCheck);
      };
      const timer = window.setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
      video.addEventListener('loadeddata', onCheck);
      video.addEventListener('playing', onCheck);
      video.addEventListener('canplay', onCheck);
      onCheck();
    });
  }

  /**
   * Charge tinyFaceDetector + landmarks + faceRecognition (une fois par session).
   * Utilise faceapi.tf (même instance TensorFlow que les réseaux).
   */
  async ensureModelsLoaded(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.modelsReady) {
      return;
    }
    if (this.loadingModels) {
      return this.loadingModels;
    }
    this.loadingModels = (async () => {
      const faceapi = await import('face-api.js');
      await faceapi.tf.ready();
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_BASE_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_BASE_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_BASE_URL);
      this.modelsReady = true;
    })();
    await this.loadingModels;
  }

  /**
   * Extrait le vecteur 128D à partir d'une data URL image (jpeg/png).
   */
  async extractDescriptorFromDataUrl(dataUrl: string): Promise<number[] | null> {
    if (!dataUrl || !this.isAvailableInThisContext()) {
      return null;
    }
    await this.ensureModelsLoaded();
    const faceapi = await import('face-api.js');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = dataUrl;
    });
    try {
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.45 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        return null;
      }
      return Array.from(detection.descriptor);
    } catch (err) {
      console.error('[FaceRecognition] extractDescriptorFromDataUrl', err);
      throw err;
    }
  }

  /**
   * Extrait le descripteur depuis une frame vidéo (caméra).
   */
  async extractDescriptorFromVideo(video: HTMLVideoElement): Promise<number[] | null> {
    if (!video || !this.isAvailableInThisContext()) {
      return null;
    }
    const hasFrame = await this.waitForVideoFrame(video);
    if (!hasFrame) {
      console.warn('[FaceRecognition] Video has no frame yet (width/height 0).');
      return null;
    }
    await this.ensureModelsLoaded();
    const faceapi = await import('face-api.js');
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.45 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        return null;
      }
      return Array.from(detection.descriptor);
    } catch (err) {
      console.error('[FaceRecognition] extractDescriptorFromVideo', err);
      throw err;
    }
  }
}
