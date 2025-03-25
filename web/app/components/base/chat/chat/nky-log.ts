type NkyLogProps = {
  query: string
  conversationId: string
  appName: string
}

export const NkyLog = async ({ query, conversationId, appName }: NkyLogProps) => {
  if (typeof window === 'undefined')
    return
  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token')
  const tenantId = searchParams.get('tenantId')
  const appId = window.location.pathname.split('/').pop()
  if (!token || !appId)
    return

  fetch('http://58.17.14.95:10005/admin-api/nky/ai-chats/create', {
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
