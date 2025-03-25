type NkyLogProps = {
  query: string
  conversationId: string
  appName: string
}

export const NkyLog = async ({ query, conversationId, appName }: NkyLogProps) => {
  const nkyUrl = process.env.NEXT_PUBLIC_NKY_URL_PREFIX
  if (typeof window === 'undefined' || !nkyUrl)
    return
  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token')
  const tenantId = searchParams.get('tenantId')
  const appId = window.location.pathname.split('/').pop()
  if (!token || !appId)
    return

  fetch(`${nkyUrl}/admin-api/nky/ai-chats/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Tenant-Id': tenantId || '1',
    },
    body: JSON.stringify({
      // query,
      id: conversationId,
      appId,
      // title:appName,
    }),
  }).catch((error) => {
    console.error('NkyLog error', error)
  })
}
