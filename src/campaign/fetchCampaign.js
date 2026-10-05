import { parseCampaign } from './parseCampaign'

async function download(fetch, url) {
  try {
    return { response: await fetch(url, { cache: 'no-store' }) }
  } catch (error) {
    return { failure: 'offline', error: error.message }
  }
}

async function readJson(response) {
  try {
    return { raw: JSON.parse(await response.text()) }
  } catch (error) {
    return { failure: 'invalid', errors: [{ path: '', message: `JSON inválido: ${error.message}` }] }
  }
}

export async function fetchCampaign(fetch, url) {
  const downloaded = await download(fetch, url)
  if (downloaded.failure) return downloaded
  if (!downloaded.response.ok) return { failure: 'http', error: `HTTP ${downloaded.response.status}` }

  const read = await readJson(downloaded.response)
  if (read.failure) return read

  const result = parseCampaign(read.raw)
  return result.ok
    ? { raw: read.raw, campaign: result.campaign }
    : { failure: 'invalid', errors: result.errors, raw: read.raw }
}
