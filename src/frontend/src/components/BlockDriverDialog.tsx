import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldOff } from "lucide-react";
import { motion } from "motion/react";

interface BlockDriverDialogProps {
  driverName: string;
  onBlock: (driverName: string) => void;
  onCancel: () => void;
}

export default function BlockDriverDialog({
  driverName,
  onBlock,
  onCancel,
}: BlockDriverDialogProps) {
  return (
    <div
      data-ocid="block_driver.modal"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-sm mx-auto bg-card border border-border/60 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Pull handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border/60" />
        </div>

        <div className="px-6 pt-5 pb-8 space-y-5">
          {/* Warning icon */}
          <div className="flex flex-col items-center gap-3 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/25 flex items-center justify-center"
            >
              <ShieldOff size={28} className="text-destructive" />
            </motion.div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-foreground tracking-tight">
                Block this driver?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You rated{" "}
                <span className="font-semibold text-foreground">
                  {driverName}
                </span>{" "}
                1&nbsp;star. Do you want to block them from accepting your
                future rides?
              </p>
            </div>
          </div>

          {/* Alert notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/8 border border-destructive/20">
            <AlertTriangle
              size={15}
              className="text-destructive mt-0.5 shrink-0"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Blocked drivers won't be matched with you. You can unblock them
              anytime from your profile.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                data-ocid="block_driver.confirm_button"
                onClick={() => onBlock(driverName)}
                className="w-full h-12 font-bold text-base bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20 rounded-xl"
              >
                <ShieldOff size={16} className="mr-2" />
                Block Driver
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                data-ocid="block_driver.cancel_button"
                variant="ghost"
                onClick={onCancel}
                className="w-full h-11 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl"
              >
                Keep Driver
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
