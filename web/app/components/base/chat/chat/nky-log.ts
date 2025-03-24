type NkyLogProps = {
  query: string
  conversationId: string
}

export const NkyLog = async ({ query, conversationId }: NkyLogProps) => {
  const nkyUrl = process.env.NEXT_PUBLIC_NKY_URL_PREFIX
  if (typeof window === 'undefined' || !nkyUrl)
    return

  const token = new URLSearchParams(window.location.search).get('token')
  if (!token)
    return

  fetch(`${nkyUrl}/api/v1/nky/log`, {
    method: 'POST',
    body: JSON.stringify({
      query,
      conversationId,
    }),
  }).catch((error) => {
    console.error('NkyLog error', error)
  })
}
