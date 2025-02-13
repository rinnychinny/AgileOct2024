import Image from "next/image";

export default function LogIn() {
  return (
     
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header>
        <div className="flex gap-10 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/home"
            //rel="noopener noreferrer"
          >
            <Image
              className="dark:not-invert"
              src="/logo.svg"
              alt="App logo"
              width={20}
              height={20}
            />
            Home Page
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="/account"
          >
            Account
          </a>
        </div>
      </header>
      <main className="flex flex-col gap-8 items-center justify-center row-start-2">
        <h1 className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <Image
            className="dark:not-invert"
            src="/logo.svg"
            alt="App logo"
            width={80}
            height={0}
            priority
          />
          Login</h1>
          <form className="flex flex-col gap-8 items-center justify-center row-start-2" id="loginForm" action="login.php" method="post">
              <input type="text" name="username" placeholder="Username" required/>
              <input type="password" name="password" placeholder="Password" required/>
              <button type="submit">Login</button>
          </form>
          </main> 
    </div>

    
     



  

      
    

  );
}
