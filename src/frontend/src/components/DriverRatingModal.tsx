import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface DriverRatingModalProps {
  driverName: string;
  onSubmit: (rating: number, comment?: string) => void;
  onSkip: () => void;
}

export default function DriverRatingModal({
  driverName,
  onSubmit,
  onSkip,
}: DriverRatingModalProps) {
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [selectedStar, setSelectedStar] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const displayRating = hoveredStar || selectedStar;

  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const handleSubmit = () => {
    if (selectedStar === 0) return;
    onSubmit(selectedStar, comment.trim() || undefined);
  };

  return (
    <div
      data-ocid="rating_modal.modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-sm mx-auto bg-card border border-border/60 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Pull handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border/60" />
        </div>

        <div className="px-6 pt-5 pb-7 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            {/* Driver avatar */}
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mb-3">
              <span className="text-2xl font-black text-primary">
                {driverName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Rate your driver
            </h2>
            <p className="text-sm text-muted-foreground">
              How was your ride with{" "}
              <span className="text-foreground font-semibold">
                {driverName}
              </span>
              ?
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  data-ocid={`rating_modal.star_button.${star}`}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedStar(star)}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    size={32}
                    className={
                      star <= displayRating
                        ? "text-warning fill-warning drop-shadow-sm"
                        : "text-muted-foreground/30"
                    }
                  />
                </motion.button>
              ))}
            </div>

            {/* Rating label */}
            <AnimatePresence mode="wait">
              {displayRating > 0 && (
                <motion.span
                  key={displayRating}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-semibold text-warning"
                >
                  {ratingLabels[displayRating]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label
              htmlFor="rating-comment"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              Add a comment (optional)
            </label>
            <Textarea
              id="rating-comment"
              data-ocid="rating_modal.comment_input"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none bg-muted/40 border-border/60 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/40"
              maxLength={200}
            />
            <p className="text-[10px] text-muted-foreground/50 text-right">
              {comment.length}/200
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <motion.button
              type="button"
              data-ocid="rating_modal.submit_button"
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={selectedStar === 0}
              className={`
                w-full h-13 py-3.5 rounded-xl font-bold text-base text-white transition-all duration-200
                ${
                  selectedStar > 0
                    ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                }
              `}
            >
              {selectedStar > 0
                ? `Submit ${selectedStar}-Star Rating`
                : "Select a rating"}
            </motion.button>

            <button
              type="button"
              data-ocid="rating_modal.skip_button"
              onClick={onSkip}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Skip for now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
