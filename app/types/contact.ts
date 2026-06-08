export type FormKind = 'propertyInquiry' | 'unlockDetails';
export type ContactSource = 'contactPage' | 'propertyDetail';
export type DesiredOpeningPeriod = 'A' | 'B' | 'C' | 'D';

export type ActionErrors = {
  formKind?: string;
  inquiryType?: string;
  inquiryContent?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  desiredOpeningPeriod?: string;
  recaptcha?: string;
  _form?: string;
};

export type FormData = {
  formKind?: FormKind;
  source?: ContactSource;
  inquiryType: string;
  inquiryContent?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  desiredOpeningPeriod?: DesiredOpeningPeriod;
  propertyTitle?: string;
  propertyId?: string;
  assignedAgent?: string;
};

export type ActionData = {
  formKind?: FormKind;
  errors?: ActionErrors;
  success: boolean;
  message?: string;
};
