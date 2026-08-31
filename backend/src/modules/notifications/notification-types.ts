/**
 * Platform genelinde kullanılan bildirim tipleri.
 * Tek bir kaynaktan yönetilir; servisler bu sabitleri kullanır.
 */
export enum NotificationType {
  REVIEW_PUBLISHED = 'review_published',
  REVIEW_REJECTED = 'review_rejected',
  REVIEW_DELETED = 'review_deleted',
  REVIEW_FLAGGED = 'review_flagged',
  COMPANY_RESPONDED = 'company_responded',
  AD_REQUEST_APPROVED = 'ad_request_approved',
  AD_REQUEST_REJECTED = 'ad_request_rejected',
}
