export default async function BatchDetails({ params }) {
  const { id } = await params;
  
  let batch;
  if (id === 'nmms') {
    batch = {
      id,
      title: 'NMMS Exam Masterclass',
      price: 'Free',
      description: 'Complete preparation guide for the National Means-cum-Merit Scholarship exam.',
      instructor: 'Govt Exam Experts',
      duration: '3 Months',
      syllabus: ['Mental Ability Test (MAT)', 'Scholastic Aptitude Test (SAT)', 'Mock Tests & Previous Year Papers']
    };
  } else {
    batch = {
      id,
      title: 'UPSC Prelims Masterclass',
      price: '₹4,999',
      description: 'A comprehensive guide to cracking the UPSC Prelims with top educators.',
      instructor: 'Dr. A. Sharma',
      duration: '6 Months',
      syllabus: ['History & Culture', 'Geography & Environment', 'Polity & Governance', 'Economy & Social Development', 'Current Affairs']
    };
  }

  return (
    <div className="container py-4">
      <div className="grid-cols-2">
        <div className="animate-fade-in">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary-dark)' }}>{batch.title}</h1>
          <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>{batch.description}</p>
          
          <div className="glass-card mb-4" style={{ padding: '1.5rem' }}>
            <h3 className="mb-2">Course Details</h3>
            <ul style={{ listStyle: 'none' }}>
              <li className="mb-2">👨‍🏫 <strong>Instructor:</strong> {batch.instructor}</li>
              <li className="mb-2">⏱️ <strong>Duration:</strong> {batch.duration}</li>
            </ul>
          </div>

          <h3 className="mb-4">Syllabus</h3>
          <ul style={{ paddingLeft: '1.5rem' }}>
            {batch.syllabus.map((topic, i) => (
              <li key={i} className="mb-2 text-muted">{topic}</li>
            ))}
          </ul>
        </div>
        
        <div className="animate-fade-in animate-delay-1">
          <div className="glass-card text-center" style={{ position: 'sticky', top: '100px' }}>
            <h2 className="text-accent mb-2" style={{ fontSize: '2.5rem' }}>{batch.price}</h2>
            <p className="text-muted mb-4">Full lifetime access.</p>
            <button className="btn-primary" style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}>{batch.price === 'Free' ? 'Enroll for Free' : 'Buy Now'}</button>
            {batch.price !== 'Free' && <p className="mt-4 text-muted" style={{ fontSize: '0.9rem' }}>7-Day Money-Back Guarantee</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
