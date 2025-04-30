import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WebsiteDTO, DropdownDTO } from '@/services/registryService';
import { toast } from 'sonner';

interface RegistryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'website' | 'category';
    onSave: (data: WebsiteDTO | DropdownDTO) => Promise<void>;
}

export function RegistryDialog({
    open,
    onOpenChange,
    type,
    onSave
}: RegistryDialogProps) {
    const [formData, setFormData] = useState<WebsiteDTO | DropdownDTO>({
        code: '',
        name: '',
        ...(type === 'website' && { url: '' })
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: string
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleSave = async () => {
        try {
            if (!formData.code || !formData.name || (type === 'website' && !(formData as WebsiteDTO).url)) {
                toast.error('All fields are required');
                return;
            }

            await onSave(formData);
            onOpenChange(false);
            setFormData({ code: '', name: '', ...(type === 'website' && { url: '' }) });
        } catch (error) {
            console.error('Error saving:', error);
            toast.error(`Failed to save ${type}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New {type === 'website' ? 'Website' : 'Category'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="code">Code</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => handleInputChange(e, 'code')}
                            placeholder="Enter code"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange(e, 'name')}
                            placeholder="Enter name"
                            className="mt-1"
                        />
                    </div>
                    {type === 'website' && (
                        <div>
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                value={(formData as WebsiteDTO).url || ''}
                                onChange={(e) => handleInputChange(e, 'url')}
                                placeholder="Enter website URL"
                                className="mt-1"
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 