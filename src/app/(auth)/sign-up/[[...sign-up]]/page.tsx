import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-200'>
      <SignUp />
    </div>
  )
}