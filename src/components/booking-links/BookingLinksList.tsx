import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getBookingLinks, toggleBookingLink, deleteBookingLink, getBookingLinkUrl, type BookingLink } from '@/services/bookingLinkService';
import ShareLinkActions from './ShareLinkActions';

interface BookingLinksListProps {
  merchantProfileId?: string;
  corporateAccountId?: string;
  refreshKey?: number;
}

const BookingLinksList = ({ merchantProfileId, corporateAccountId, refreshKey }: BookingLinksListProps) => {
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLinks = async () => {
    try {
      const data = await getBookingLinks(merchantProfileId, corporateAccountId);
      setLinks(data);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [merchantProfileId, corporateAccountId, refreshKey]);

  const handleToggle = async (linkId: string, isActive: boolean) => {
    try {
      await toggleBookingLink(linkId, isActive);
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, is_active: isActive } : l));
      toast.success(isActive ? 'Link activated' : 'Link deactivated');
    } catch {
      toast.error('Failed to update link');
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      await deleteBookingLink(linkId);
      setLinks(prev => prev.filter(l => l.id !== linkId));
      toast.success('Link deleted');
    } catch {
      toast.error('Failed to delete link');
    }
  };

  const isExpired = (link: BookingLink) => {
    return link.expires_at && new Date(link.expires_at) < new Date();
  };

  const isMaxedOut = (link: BookingLink) => {
    return link.max_uses !== null && link.times_used >= link.max_uses;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading links...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Your Booking Links
        </CardTitle>
        <CardDescription>{links.length} link{links.length !== 1 ? 's' : ''} created</CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No booking links yet. Create your first one above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map(link => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{link.service_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{link.service_type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.link_type === 'payment' ? 'default' : 'secondary'}>
                        {link.link_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{link.link_code}</code>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{link.times_used}</span>
                      {link.max_uses && <span className="text-muted-foreground">/{link.max_uses}</span>}
                    </TableCell>
                    <TableCell>
                      {isExpired(link) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isMaxedOut(link) ? (
                        <Badge variant="secondary">Maxed Out</Badge>
                      ) : (
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={(v) => handleToggle(link.id, v)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <ShareLinkActions
                        linkUrl={getBookingLinkUrl(link.link_code)}
                        serviceName={link.service_name}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(link.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingLinksList;
