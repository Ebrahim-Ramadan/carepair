"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import type { Ticket, CreateTicketInput } from "@/lib/types";

const REPAIR_PARTS = [
	"Front Bumper",
	"Rear Bumper",
	"Left Door",
	"Right Door",
	"Hood",
	"Trunk",
	"Left Fender",
	"Right Fender",
	"Front Windshield",
	"Rear Windshield",
	"Side Mirror",
	"Headlight",
	"Taillight",
	"Grille",
	"Side Panel",
];

type TicketFormProps = {
	onSuccess: (ticket: Ticket) => void;
};

export function TicketForm({ onSuccess }: TicketFormProps) {
	const [plateNumber, setPlateNumber] = useState("");
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [customerEmail, setCustomerEmail] = useState("");
	const [mileage, setMileage] = useState("");
	const [repairParts, setRepairParts] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const input: CreateTicketInput = {
				plateNumber: plateNumber.trim(),
				customerName: customerName.trim(),
				customerPhone: customerPhone.trim(),
				customerEmail: customerEmail.trim() || undefined,
				mileage: Number(mileage),
				repairParts,
			};

			const response = await fetch("/api/tickets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create ticket");
			}

			const ticket = await response.json();
			toast.success("Ticket created successfully!");

			// Reset form
			setPlateNumber("");
			setCustomerName("");
			setCustomerPhone("");
			setCustomerEmail("");
			setMileage("");
			setRepairParts([]);

			onSuccess(ticket);
		} catch (error) {
			console.error("Error creating ticket:", error);
			toast.error(
				`Failed to create ticket: ${
					error instanceof Error ? error.message : "Please try again."
				}`
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="rounded-lg border border-border bg-card p-6">
			<div className="mb-6">
				<h2 className="text-xl font-semibold text-foreground">
					Create New Ticket
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					Fill in the details to create a new service ticket
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Vehicle Information */}
				<div className="space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Vehicle Information
					</h3>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="plateNumber">Plate Number *</Label>
							<Input
								id="plateNumber"
								value={plateNumber}
								onChange={(e) => setPlateNumber(e.target.value)}
								placeholder="ABC-1234"
								required
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="mileage">Mileage (km) *</Label>
							<Input
								id="mileage"
								type="number"
								value={mileage}
								onChange={(e) => setMileage(e.target.value)}
								placeholder="50000"
								required
								disabled={isSubmitting}
								min="0"
							/>
						</div>
					</div>
				</div>

				{/* Customer Information */}
				<div className="space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Customer Information
					</h3>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="customerName">Customer Name *</Label>
							<Input
								id="customerName"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								placeholder="John Doe"
								required
								disabled={isSubmitting}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="customerPhone">Phone Number *</Label>
							<Input
								id="customerPhone"
								type="tel"
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
								placeholder="+1 234 567 8900"
								required
								disabled={isSubmitting}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="customerEmail">Email Address</Label>
						<Input
							id="customerEmail"
							type="email"
							value={customerEmail}
							onChange={(e) => setCustomerEmail(e.target.value)}
							placeholder="john.doe@example.com"
							disabled={isSubmitting}
						/>
					</div>
				</div>

				{/* Repair Parts */}
				<div className="space-y-4">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Repair Parts
					</h3>
					<div className="space-y-2">
						<Label htmlFor="repairParts">Select Parts to Repair</Label>
						<MultiSelect
							options={REPAIR_PARTS}
							selected={repairParts}
							onChange={setRepairParts}
							placeholder="Select repair parts..."
							className="w-full"
						/>
					</div>
					{repairParts.length > 0 && (
						<div className="text-xs text-muted-foreground">
							{repairParts.length} part
							{repairParts.length !== 1 ? "s" : ""} selected for repair
						</div>
					)}
				</div>

				{/* Submit Button */}
				<div className="pt-4">
					<Button
						type="submit"
						className="w-full"
						disabled={isSubmitting}
						size="lg"
					>
						{isSubmitting ? (
							<>
								<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
								Creating Ticket...
							</>
						) : (
							"Create Ticket"
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
