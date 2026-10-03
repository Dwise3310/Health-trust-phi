import { redirect } from "next/navigation";

export default function CardsRedirect() {
  redirect("/dashboard/appointments");
}
