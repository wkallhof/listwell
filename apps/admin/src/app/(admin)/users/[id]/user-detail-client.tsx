"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, Package, Activity, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActivityTimeline } from "@/components/activity-timeline";
import { CreditActionModal } from "@/components/credit-action-modal";
import { SuspendAction } from "@/components/suspend-action";

interface UserDetailClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    suspended: boolean;
    suspendedReason: string | null;
    createdAt: string;
    updatedAt: string;
  };
  credits: {
    balance: number;
    freeCreditsGranted: boolean;
  };
  listings: {
    total: number;
    ready: number;
    processing: number;
    errored: number;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    listingId: string | null;
    appleTransactionId: string | null;
    adminUserId: string | null;
    reason: string | null;
    note: string | null;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    userId: string;
    eventType: string;
    description: string | null;
    resourceType: string | null;
    resourceId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  }>;
}

export function UserDetailClient({
  user,
  credits,
  listings,
  transactions,
  activities,
}: UserDetailClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.suspended && (
              <Badge variant="destructive">Suspended</Badge>
            )}
            {user.role === "admin" && (
              <Badge variant="secondary">Admin</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <CreditActionModal
            userId={user.id}
            userName={user.name}
            currentBalance={credits.balance}
            action="grant"
          />
          <CreditActionModal
            userId={user.id}
            userName={user.name}
            currentBalance={credits.balance}
            action="deduct"
          />
          <SuspendAction
            userId={user.id}
            userName={user.name}
            isSuspended={user.suspended}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <CreditCard className="text-muted-foreground" size={16} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{credits.balance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Package className="text-muted-foreground" size={16} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{listings.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Errored</CardTitle>
            <Activity className="text-muted-foreground" size={16} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{listings.errored}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <User className="text-muted-foreground" size={16} />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Suspended banner */}
      {user.suspended && user.suspendedReason && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Suspension reason: {user.suspendedReason}
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credits">Credit History</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{user.suspended ? "Suspended" : "Active"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free Credits Granted</span>
                <span>{credits.freeCreditsGranted ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ready</span>
                <span className="font-mono">{listings.ready}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing</span>
                <span className="font-mono">{listings.processing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Errored</span>
                <span className="font-mono text-destructive">{listings.errored}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>Credit Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance After</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={tx.amount >= 0 ? "secondary" : "destructive"}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </TableCell>
                        <TableCell className="font-mono">{tx.balanceAfter}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.reason ?? tx.note ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle>User Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {listings.total} total listings. View all in{" "}
                <Link href={`/listings?userId=${user.id}`} className="text-primary hover:underline">
                  Listings
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline activities={activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
