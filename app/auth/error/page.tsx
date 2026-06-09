export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
      <p className="text-gray-600 mb-6">
        There was an issue verifying your account. The link may have expired or is invalid.
      </p>
      <a 
        href="/login" 
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
      >
        Back to Login
      </a>
    </div>
  )
}