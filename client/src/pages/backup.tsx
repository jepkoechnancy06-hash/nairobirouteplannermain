import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Database, Clock, CheckCircle, AlertCircle, Loader2, HardDrive } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Backup {
  id: string;
  type: string;
  filename: string;
  size: number;
  recordCount: number;
  status: string;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function BackupPage() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: backupHistory = [], isLoading: historyLoading } = useQuery<Backup[]>({
    queryKey: ["/api/backup/history"],
  });

  const downloadBackup = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create backup");
      }
      
      const backup = await response.json();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `veew_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Created",
        description: `Successfully backed up ${backup.metadata.totalRecords} records`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="backup-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-title">Data Backup</h1>
          <p className="text-muted-foreground">Download and manage your data backups</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card data-testid="card-manual-backup">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Backup</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Download a complete backup of all your data including shops, drivers, routes, targets, and analytics.
            </p>
            <Button 
              onClick={downloadBackup} 
              disabled={isDownloading}
              className="w-full"
              data-testid="button-download-backup"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-auto-backup">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automated Backups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Daily automated backups are enabled. The system automatically backs up your data every 24 hours.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-backup-stats">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Statistics</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-backup-count">{backupHistory.length}</div>
            <p className="text-xs text-muted-foreground">Total backups created</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-backup-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>View all previous backups created</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups created yet</p>
              <p className="text-sm">Click "Download Backup" to create your first backup</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupHistory.map((backup) => (
                  <TableRow key={backup.id} data-testid={`row-backup-${backup.id}`}>
                    <TableCell className="font-medium">
                      {formatDate(backup.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={backup.type === "manual" ? "outline" : "secondary"}>
                        {backup.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.recordCount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{formatBytes(backup.size || 0)}</TableCell>
                    <TableCell>
                      {backup.status === "completed" ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">What's included in backups?</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>User accounts (without passwords for security)</li>
              <li>Active sessions and password reset tokens</li>
              <li>All shops and their details</li>
              <li>Driver information and assignments</li>
              <li>Route configurations and history</li>
              <li>Target settings and progress</li>
              <li>AI analytics data (route optimizations, demand forecasts, driver insights)</li>
              <li>Generated reports</li>
              <li>Backup history</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">How to restore from backup?</h4>
            <p className="text-sm text-muted-foreground">
              To restore data from a backup file, contact support with your backup JSON file. 
              The restoration process will be handled by the technical team to ensure data integrity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
