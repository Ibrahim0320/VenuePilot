import { Badge } from "@/components/Badge";

type Confidence = "low" | "medium" | "high";

const variantByConfidence: Record<Confidence, "danger" | "warning" | "success"> =
  {
    low: "danger",
    medium: "warning",
    high: "success"
  };

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <Badge variant={variantByConfidence[confidence]}>
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
    </Badge>
  );
}
