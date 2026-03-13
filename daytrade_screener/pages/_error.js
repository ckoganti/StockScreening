import React from 'react'

export default function Error({ statusCode }) {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>Something went wrong</h1>
      <p>Status code: {statusCode || 'Unknown'}</p>
      <p>Please refresh the page or try again later.</p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
