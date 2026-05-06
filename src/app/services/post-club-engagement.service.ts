import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface PostEngagementSummary {
  postId: number;
  reactionCounts: Record<string, number>;
  myReaction: string | null;
  commentCount: number;
}

export interface PostCommentView {
  id: number;
  idAuteur: number;
  auteurNom: string;
  contenu: string;
  dateCreation: string;
  aiSentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | string;
  aiCorrectionApplied?: boolean;
  aiTranslatedToEnglish?: boolean;
}

export interface AdminEngagementRow {
  postId: number;
  clubId: number;
  clubNom: string;
  contenuApercu: string;
  datePost: string;
  reactionCounts: Record<string, number>;
  totalReactions: number;
  totalComments: number;
  comments: PostCommentView[];
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostClubEngagementService {
  private basePosts = `${API_URL}/posts-club`;
  /** Préfixe sous /api/posts-club pour passer par la même route gateway que les posts */
  private baseAdmin = `${API_URL}/posts-club/admin/engagement`;

  constructor(private http: HttpClient) {}

  batchSummaries(postIds: number[], viewerId: number | null): Observable<PostEngagementSummary[]> {
    return this.http.post<PostEngagementSummary[]>(`${this.basePosts}/engagement/batch`, {
      postIds,
      viewerId: viewerId ?? undefined
    });
  }

  setReaction(postId: number, idEtudiant: number, reactionType: string): Observable<void> {
    return this.http.post<void>(`${this.basePosts}/${postId}/reactions`, {
      idEtudiant,
      reactionType
    });
  }

  clearReaction(postId: number, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.delete<void>(`${this.basePosts}/${postId}/reactions`, { params });
  }

  listComments(postId: number): Observable<PostCommentView[]> {
    return this.http.get<PostCommentView[]>(`${this.basePosts}/${postId}/comments`);
  }

  addComment(postId: number, idEtudiant: number, contenu: string, translateToEnglish?: boolean): Observable<PostCommentView> {
    return this.http.post<PostCommentView>(`${this.basePosts}/${postId}/comments`, {
      idEtudiant,
      contenu,
      translateToEnglish: !!translateToEnglish
    });
  }

  deleteOwnComment(commentId: number, userId: number): Observable<void> {
    const params = new HttpParams().set('userId', String(userId));
    return this.http.delete<void>(`${this.basePosts}/comments/${commentId}`, { params });
  }

  adminEngagementPage(
    clubId: number | null,
    pageIndex: number,
    pageSize: number
  ): Observable<SpringPage<AdminEngagementRow>> {
    let params = new HttpParams()
      .set('page', String(pageIndex))
      .set('size', String(pageSize));
    if (clubId != null) {
      params = params.set('clubId', String(clubId));
    }
    return this.http.get<SpringPage<AdminEngagementRow>>(this.baseAdmin, { params });
  }

  adminDeleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseAdmin}/comments/${commentId}`);
  }
}


