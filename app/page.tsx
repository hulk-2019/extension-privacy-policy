import { redirect } from "next/navigation";

export { metadata } from "./music/page";

export default function Home() {
  redirect("/music");
}
