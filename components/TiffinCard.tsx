import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Minus, Check, X, Loader2 } from "lucide-react";

interface TiffinCardProps {
  member: {
    user: { _id: string; name: string; email: string };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: any;
  updating: string | null;
  onUpdate: (customerId: string, meal: "lunchStatus" | "dinnerStatus", value: string) => void;
}

const TiffinCard = memo(({ member, entry, updating, onUpdate }: TiffinCardProps) => {
  const renderStatusButtons = (meal: "lunchStatus" | "dinnerStatus") => {
    const status = entry[meal];
    
    // Determine payment status
    const paymentStatusField = meal === "lunchStatus" ? "lunchPaymentStatus" : "dinnerPaymentStatus";
    const billField = meal === "lunchStatus" ? "lunchBill" : "dinnerBill";
    const paymentStatus = entry[paymentStatusField];
    const isBilled = !!entry[billField];
    const isPaid = paymentStatus === "paid";
    
    const customerId = member.user._id;
    
    return (
      <div className="flex flex-col space-y-1 w-full">
        <ToggleGroup
          value={[String(status ?? "none")]}
          onValueChange={(values: string[]) => {
            const value = values[0];
            if (value && !isPaid) onUpdate(customerId, meal, value);
          }}
          disabled={isPaid || updating === `${customerId}-${meal}`}
          className="justify-between bg-muted/20 p-1 rounded-lg border border-border/40 flex w-full"
        >
          <ToggleGroupItem 
            value="none" 
            aria-label="Toggle none" 
            className={`flex-1 h-8 px-1 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground rounded-md`}
          >
            <Minus className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="consumed" 
            aria-label="Toggle consumed"
            className={`flex-1 h-8 px-1 data-[state=on]:bg-emerald-500 data-[state=on]:text-white data-[state=on]:shadow-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md`}
          >
            <Check className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="cancelled" 
            aria-label="Toggle cancelled"
            className={`flex-1 h-8 px-1 data-[state=on]:bg-rose-500 data-[state=on]:text-white data-[state=on]:shadow-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md`}
          >
            <X className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <div className="flex justify-between items-center px-1 min-h-4">
          {updating === `${customerId}-${meal}` ? (
             <span className="text-[9px] text-muted-foreground flex items-center font-medium uppercase tracking-wider">
               <Loader2 className="h-3 w-3 animate-spin mr-1"/> Updating
             </span>
          ) : (
            <div className="flex items-center justify-end w-full gap-1">
              {isPaid && (
                <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider px-1 py-0">Paid</Badge>
              )}
              {isBilled && !isPaid && status !== "none" && (
                <Badge variant="outline" className="text-[9px] h-4 bg-orange-50 text-orange-700 border-orange-200 uppercase tracking-wider px-1 py-0">Billed</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-2.5 bg-muted/10 border-b border-border flex items-center space-x-2.5">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {member.user.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{member.user.name}</h3>
          <p className="text-[10px] text-muted-foreground truncate">{member.user.email}</p>
        </div>
      </div>
      <div className="p-3 pb-1 space-y-2 flex-1">
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-12 shrink-0">Lunch</div>
          <div className="flex-1">{renderStatusButtons("lunchStatus")}</div>
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-border/50">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-12 shrink-0">Dinner</div>
          <div className="flex-1">{renderStatusButtons("dinnerStatus")}</div>
        </div>
      </div>
    </Card>
  );
});

TiffinCard.displayName = "TiffinCard";

export default TiffinCard;
