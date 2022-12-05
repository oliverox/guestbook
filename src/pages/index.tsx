import { type NextPage } from "next";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";

const Messages = () => {
  const { data: messages, isLoading } = trpc.guestbook.getAll.useQuery();

  if (isLoading) return <div>Fetching messages...</div>;

  return (
    <div className="flex flex-col gap-4">
      {messages?.map((msg, index) => {
        return (
          <div key={index}>
            <p>{msg.message}</p>
            <span>- {msg.name}</span>
          </div>
        );
      })}
    </div>
  );
};

const Form = () => {
  const utils = trpc.useContext();
  const [message, setMessage] = useState("");
  const { data: session } = useSession();
  const postMessage = trpc.guestbook.postMessage.useMutation({
    onMutate: () => {
      utils.guestbook.getAll.cancel();
      const optimisticUpdate = utils.guestbook.getAll.getData();
      if (optimisticUpdate) {
        utils.guestbook.getAll.setData(undefined, optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.guestbook.getAll.invalidate();
    },
  });

  return (
    session && (
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          postMessage.mutate({
            name: session.user?.name as string,
            message,
          });
          setMessage("");
        }}
      >
        <input
          type="text"
          value={message}
          placeholder="Your message..."
          minLength={2}
          maxLength={100}
          onChange={(event) => setMessage(event.target.value)}
          className="rounded-md border-2 border-zinc-800 bg-neutral-900 px-4 py-2 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
        >
          Submit
        </button>
      </form>
    )
  );
};

const Home: NextPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="pt-4 text-3xl">Guestbook</h1>
      <p>
        Built to learn more about{" "}
        <code className="bg-yellow-300 text-neutral-900">create-t3-app</code>
      </p>
      <div className="pt-10">
        {session ? (
          <>
            <p>Hi {session.user?.name}</p>
            <button
              className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
              onClick={() => signOut()}
            >
              Logout
            </button>
            <div className="pt-6">
              <Form />
            </div>
          </>
        ) : (
          <>
            <button
              className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
              onClick={() => signIn("google")}
            >
              Login with Google
            </button>
            <button
              className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
              onClick={() => signIn("discord")}
            >
              Login with Discord
            </button>
          </>
        )}
        <div className="pt-10">
          <Messages />
        </div>
      </div>
    </main>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => signOut() : () => signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
