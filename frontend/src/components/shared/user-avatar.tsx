import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import type { User } from "@/types/user";

export function UserAvatar({
  user,
  className,
}: {
  user: User;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-9", className)}>
      {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
      <AvatarFallback className="bg-indigo-100 text-indigo-700">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
