export function readInvite(search) {
  const value = new URLSearchParams(search).get('campanha')
  if (!value) return null
  try {
    const { protocol } = new URL(value)
    return protocol === 'https:' || protocol === 'http:' ? value : null
  } catch {
    return null
  }
}

export function inviteLink(appOrigin, campaignUrl) {
  return `${appOrigin}/?campanha=${encodeURIComponent(campaignUrl)}`
}
