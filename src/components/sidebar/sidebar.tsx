"use client";
import { LogIn, LogOut, SquarePen } from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  Sidebar,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import Link from "next/link";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Avatar, AvatarImage } from "../ui/avatar";
import { PopoverContent, PopoverTrigger } from "../ui/popover";
import { Popover } from "../ui/popover";
import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useQuery,
} from "convex/react";
import { api } from "../../../convex/_generated/api";
import { makeSideBarItems } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function AppSidebar() {
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const { open, isMobile, setOpenMobile } = useSidebar();
  const path = usePathname();
  const data = useQuery(api.chat.getUserChats);

  type SidebarMenuItem = {
    title: string;
    url: string;
    creationTime: Date;
  };

  // Function to get relative time label
  const getRelativeTimeLabel = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays <= 7) {
      return "This Week";
    } else if (diffInDays <= 30) {
      return "This Month";
    } else {
      return "Older";
    }
  };

  const groupItemsByTime = (items: SidebarMenuItem[]) => {
    const groups: { [key: string]: SidebarMenuItem[] } = {};

    items.forEach((item) => {
      const label = getRelativeTimeLabel(item.creationTime);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });

    // Sort items within each group by creation time (newest first for desktop, oldest first for mobile)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (isMobile) {
          return a.creationTime.getTime() - b.creationTime.getTime(); // oldest first
        } else {
          return b.creationTime.getTime() - a.creationTime.getTime(); // newest first
        }
      });
    });

    return groups;
  };

  let items: SidebarMenuItem[] = [];
  if (isAuthenticated) {
    items = data ? makeSideBarItems(data) : [];
  }

  const groupedItems = groupItemsByTime(items);

  // Define the order of time groups
  const timeGroupOrder = [
    "Today",
    "Yesterday",
    "This Week",
    "This Month",
    "Older",
  ];

  // Sort groups by time order, but reverse for mobile to show most recent at bottom
  const sortedGroups = timeGroupOrder.filter((group) => groupedItems[group]);
  const finalGroupOrder = isMobile ? sortedGroups.reverse() : sortedGroups;

  return (
    <Sidebar variant="floating">
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
            {/* <div className="px-2 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your threads..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-purple-300"
                />
              </div>
            </div> */}
          </>
        )}
      </SidebarHeader>
      <SidebarContent className={isMobile ? "flex flex-col-reverse" : ""}>
        {finalGroupOrder.map((groupLabel, index) => (
          <SidebarGroup key={index}>
            <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {groupedItems[groupLabel].map((item, index) => (
                  <SidebarMenuItem key={`${groupLabel}-${index}`}>
                    <Link href={item.url} passHref>
                      <SidebarMenuButton
                        isActive={item.url === path}
                        asChild
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {isMobile && (
          <>
            {/* <div className="px-2 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your threads..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:border-purple-300"
                />
              </div>
            </div> */}
            <div className="flex gap-2 p-1">
              <Link href={"/"}>
                <Button
                  className="flex-1 bg-[#A5406D] hover:bg-[#D56798] hover:cursor-pointer text-white rounded-lg h-10"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <div className="flex justify-center items-center gap-2">
                    New Chat
                    <SquarePen className="h-4 w-4" />
                  </div>
                </Button>
              </Link>
              <Unauthenticated>
                <SignInButton>
                  <div className="flex-1 hover:bg-accent rounded-lg">
                    <div className="flex justify-center bg-[#FAF3FA] rounded-lg hover:cursor-pointer items-center gap-2 h-10">
                      Login <LogIn className="h-4 w-4" />
                    </div>
                  </div>
                </SignInButton>
              </Unauthenticated>

              <Authenticated>
                {/* <Link
                  href="/settings"
                  className="flex-1 hover:bg-accent rounded-lg"
          
                >
                  <div className="flex  justify-center items-center bg-[#FAF3FA] rounded-lg hover:cursor-pointer h-10">
                    <Settings className="h-4 w-4" />
                  </div>
                </Link> */}
                <SignOutButton>
                  <div className="flex-1 hover:bg-accent rounded-lg">
                    <div className="flex justify-center bg-[#FAF3FA] rounded-lg hover:cursor-pointer items-center gap-2 h-10">
                      <LogOut className=" h-4 w-4" />
                    </div>
                  </div>
                </SignOutButton>
              </Authenticated>
            </div>
          </>
        )}
        {!isMobile && (
          <div className="flex justify-center items-center gap-2 p-3 hover:bg-accent hover:cursor-pointer rounded-lg">
            <Unauthenticated>
              <SignInButton>
                <div className="flex items-center gap-2  rounded-lg px-4 py-2 cursor-pointer">
                  <LogIn className="h-4 w-4" /> Sign In
                </div>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
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
                  className="my-5 p-5 w-50 bg-accent text-sidebar-foreground  flex flex-col rounded-lg shadow-lg "
                >
                  <SignOutButton>
                    <div className="flex items-center gap-2 hover:bg-background rounded-lg px-4 py-2 cursor-pointer">
                      <LogOut className=" h-4 w-4" /> Sign Out
                    </div>
                  </SignOutButton>
                  {/* <Link
                    href="/settings"
                    className="flex items-center gap-2 hover:bg-background rounded-lg px-4 py-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link> */}
                </PopoverContent>
              </Popover>
            </Authenticated>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
