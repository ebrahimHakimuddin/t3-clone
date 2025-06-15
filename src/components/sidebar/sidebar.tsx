"use client";
import { LogIn, LogOut, Search, Settings, SquarePen } from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  Sidebar,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useUser,
} from "@clerk/nextjs";
import { Avatar, AvatarImage } from "../ui/avatar";
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Popover } from "../ui/popover";
import { ResizablePanel } from "../ui/resizable";

export default function AppSidebar() {
  const { user } = useUser();
  const { open, isMobile } = useSidebar();
  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
    },
  ];
  console.log(user);
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex justify-center items-center">
          <div>{open && <SidebarTrigger />}</div>
          <div className="flex-1 text-center font-bold">T3.Clone</div>
          <div></div>
        </div>
        {!isMobile && (
          <>
            <div className="p-1">
              <Link href={"/"}>
                <Button className="w-full bg-[#A5406D] hover:bg-[#D56798] hover:cursor-pointer text-white rounded-lg">
                  <div className="flex justify-center items-center gap-2">
                    New Chat
                    <SquarePen className="h-4 w-4" />
                  </div>
                </Button>
              </Link>
            </div>
            <div className="px-2 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your threads..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-purple-300"
                />
              </div>
            </div>
          </>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url} passHref legacyBehavior>
                    <SidebarMenuButton asChild>
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isMobile && (
          <>
            <div className="px-2 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your threads..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-purple-300"
                />
              </div>
            </div>
            <div className="flex gap-2 p-1">
              <Link href={"/"}>
                <Button className="flex-1 bg-[#A5406D] hover:bg-[#D56798] hover:cursor-pointer text-white rounded-lg h-10">
                  <div className="flex justify-center items-center gap-2">
                    New Chat
                    <SquarePen className="h-4 w-4" />
                  </div>
                </Button>
              </Link>
              <SignedOut>
                <SignInButton>
                  <div className="flex-1 hover:bg-accent rounded-lg">
                    <div className="flex justify-center bg-[#FAF3FA] rounded-lg hover:cursor-pointer items-center gap-2 h-10">
                      Login <LogIn className="h-4 w-4" />
                    </div>
                  </div>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/settings"
                  className="flex-1 hover:bg-accent rounded-lg"
                >
                  <div className="flex justify-center items-center bg-[#FAF3FA] rounded-lg hover:cursor-pointer h-10">
                    <Settings className="h-4 w-4" />
                  </div>
                </Link>
                <SignOutButton>
                  <div className="flex-1 hover:bg-accent rounded-lg">
                    <div className="flex justify-center bg-[#FAF3FA] rounded-lg hover:cursor-pointer items-center gap-2 h-10">
                      <LogOut className=" h-4 w-4" />
                    </div>
                  </div>
                </SignOutButton>
              </SignedIn>
            </div>
          </>
        )}
        {!isMobile && (
          <div className="flex justify-center items-center gap-2 p-3 hover:bg-accent hover:cursor-pointer rounded-lg">
            <SignedOut>
              <SignInButton>
                <div className="flex items-center gap-2  rounded-lg px-4 py-2 cursor-pointer">
                  <LogIn className="h-4 w-4" /> Sign In
                </div>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Popover>
                <PopoverTrigger className="hover:bg-accent hover:cursor-pointer rounded-lg flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user?.imageUrl}></AvatarImage>
                  </Avatar>
                  {user?.fullName}
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="center"
                  className="my-5 p-5 w-50 bg-accent  flex flex-col rounded-lg shadow-lg "
                >
                  <SignOutButton>
                    <div className="flex items-center gap-2 hover:bg-background rounded-lg px-4 py-2 cursor-pointer">
                      <LogOut className=" h-4 w-4" /> Sign Out
                    </div>
                  </SignOutButton>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 hover:bg-background rounded-lg px-4 py-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </PopoverContent>
              </Popover>
            </SignedIn>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
