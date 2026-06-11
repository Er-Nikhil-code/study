import React from 'react';
export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  return <div>{unwrappedParams.id}</div>;
}
