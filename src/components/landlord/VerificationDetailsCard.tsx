import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SingleDocumentUpload } from "./SingleDocumentUpload";
import {
  Shield,
  Loader2,
  BadgeCheck,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard as IdCardIcon,
  FileCheck2,
} from "lucide-react";
import { format } from "date-fns";

interface VerificationDetailsCardProps {
  landlordProfile: any;
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
}

export function VerificationDetailsCard({
  landlordProfile,
  isVerified,
  isPending,
  isRejected,
}: VerificationDetailsCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [idNumber, setIdNumber] = useState("");
  const [kraPin, setKraPin] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [idDocument, setIdDocument] = useState<string | null>(null);
  const [kraDocument, setKraDocument] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (landlordProfile) {
      setIdNumber(landlordProfile.id_number || "");
      setKraPin(landlordProfile.kra_pin || "");
      setBusinessPhone(landlordProfile.business_phone || "");

      // Map documents array: index 0 = ID doc, index 1 = KRA doc
      const docs = landlordProfile.documents || [];
      setIdDocument(docs[0] || null);
      setKraDocument(docs[1] || null);
    }
  }, [landlordProfile]);

  const handleSave = async (submit = false) => {
    if (!user?.id) return;
    setSaving(true);

    const documents = [idDocument, kraDocument].filter(Boolean) as string[];

    if (submit) {
      if (!idNumber || !idDocument) {
        toast({
          title: "Incomplete",
          description: "Please enter your ID number and upload your ID document",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      if (!kraPin || !kraDocument) {
        toast({
          title: "Incomplete",
          description: "Please enter your KRA PIN and upload relevant KRA Documents",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      if (!businessPhone) {
        toast({ title: "Incomplete", description: "Please enter your business phone number", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    const updates: Record<string, any> = {
      id_number: idNumber,
      kra_pin: kraPin,
      business_phone: businessPhone,
      documents,
    };
    if (submit) updates.verification_status = "pending";

    if (landlordProfile) {
      const { error } = await supabase.from("landlord_profiles").update(updates).eq("user_id", user.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("landlord_profiles").insert({ user_id: user.id, ...updates });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast({ title: submit ? "Submitted for review!" : "Details saved" });
    queryClient.invalidateQueries({ queryKey: ["landlord-profile"] });
  };

  const isDisabled = isPending || isVerified;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" /> Verification Details
        </CardTitle>
        <CardDescription>
          {isVerified ? "Your account is verified" : "Complete each step to get verified and start listing properties"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rejection notice */}
        {isRejected && landlordProfile?.verification_notes && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <strong>Rejection reason:</strong> {landlordProfile.verification_notes}
          </div>
        )}

        {/* Step 1: National ID */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
              1
            </div>
            <IdCardIcon className="w-4 h-4 text-primary" />
            National ID
          </div>

          <div className="pl-8 space-y-3">
            <div>
              <Label htmlFor="idNumber">ID Number *</Label>
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g., 12345678"
                disabled={isDisabled}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Upload ID Copy *</Label>
              <SingleDocumentUpload
                label="Upload National ID"
                value={idDocument}
                onChange={setIdDocument}
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Step 2: KRA Tax Compliance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
              2
            </div>
            <FileCheck2 className="w-4 h-4 text-primary" />
            KRA Tax Compliance
          </div>

          <div className="pl-8 space-y-3">
            <div>
              <Label htmlFor="kraPin">KRA PIN *</Label>
              <Input
                id="kraPin"
                value={kraPin}
                onChange={(e) => setKraPin(e.target.value)}
                placeholder="e.g., A001234567Z"
                disabled={isDisabled}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Upload Tax Compliance Certificate *</Label>
              <SingleDocumentUpload
                label="Upload KRA Certificate"
                value={kraDocument}
                onChange={setKraDocument}
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Business Phone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
              3
            </div>
            Business Contact
          </div>
          <div className="pl-8">
            <Label htmlFor="businessPhone">Business Phone *</Label>
            <Input
              id="businessPhone"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder="e.g., 0722123456"
              disabled={isDisabled}
            />
          </div>
        </div>

        {/* Actions */}
        {!isVerified && !isPending && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1"
            >
              Save Draft
            </Button>
            <Button type="button" onClick={() => handleSave(true)} disabled={saving} className="flex-1 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
              Submit for Review
            </Button>
          </div>
        )}

        {isPending && (
          <div className="p-3 rounded-lg bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/20 text-sm text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-[hsl(var(--gold))]" />
            Your verification is under review
          </div>
        )}

        {isVerified && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-center text-primary">
            <CheckCircle className="w-5 h-5 mx-auto mb-1" />
            Account verified
            {landlordProfile?.verified_at && (
              <p className="text-xs mt-1 text-muted-foreground">
                on {format(new Date(landlordProfile.verified_at), "MMM d, yyyy")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
