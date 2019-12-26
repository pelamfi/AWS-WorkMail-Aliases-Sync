
export function emailDomain(email: string): string {
  let split = email.split('@')
  if(split.length >= 2) {
    return split[split.length - 1] // name part can contain @ characters
  } else {
    return ""
  }
}

export function emailLocal(email: string): string {
  let domain = emailDomain(email)
  return email.substring(0, email.length - domain.length - 1)
}