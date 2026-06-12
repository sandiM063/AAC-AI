import { isValidLanguageId, type LanguageId } from "@/lib/languages";
import { getCurrentUser } from "@/lib/user-session";
import { createTranslator, type Translator } from "./index";

export async function getUserLanguage(): Promise<LanguageId> {
  const user = await getCurrentUser();
  return user && isValidLanguageId(user.language) ? user.language : "en";
}

export async function getServerTranslator(): Promise<Translator> {
  return createTranslator(await getUserLanguage());
}
