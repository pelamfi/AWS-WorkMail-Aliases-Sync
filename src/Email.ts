
export interface Email extends String {
  _EmailBrand: string;
};

export function emailFrom(email: string, domain?: string): Email {
  if (domain === undefined) {
    return email as unknown as Email;
  } else {
    return `${email}@${domain}` as unknown as Email;
  }
}

export function emailString(email: Email): string {
  return email as unknown as string;
}

export function emailDomain(email: Email) {
  const split = emailString(email).split('@');
  if (split.length >= 2) {
    return split[split.length - 1]; // name part can contain @ characters
  } else {
    return '';
  }
}

export function emailLocal(email: Email) {
  const domain = emailDomain(email);
  const str = emailString(email);
  return str.substring(0, str.length - domain.length - 1);
}
