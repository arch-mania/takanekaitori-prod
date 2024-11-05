export type ActionErrors = {
  inquiryType?: string;
  inquiryContent?: string;
  name?: string;
  email?: string;
  message?: string;
  _form?: string;
};

export type FormData = {
  inquiryType: string;
  inquiryContent?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyTitle?: string;
  propertyId?: string;
  assignedAgent?: string;
};

export type ActionData = {
  errors?: ActionErrors;
  success: boolean;
  message?: string;
};
