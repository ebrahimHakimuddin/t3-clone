import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function makeSideBarItems(data: { chatName: string; chatId: string; _creationTime: number }[]) {
  return data.map((item) => ({
    title: item.chatName,
    url: `/chat/${item.chatId}`,
    creationTime: new Date(item._creationTime),
  }));
}