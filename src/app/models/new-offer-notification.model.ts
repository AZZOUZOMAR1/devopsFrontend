export interface NewOfferNotificationDto {
  id: number;
  title: string;
  company: string;
  location?: string;
  contractType?: string;
  date: string;
  message: string;
}
