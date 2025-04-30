import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CrawlerConfigDTO, crawlerConfigService } from '@/services/crawlerConfigService';
import { DropdownDTO, registryService } from '@/services/registryService';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';

interface CrawlerConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CrawlerConfigDTO;
  websites: DropdownDTO[];
  categories: DropdownDTO[];
  onSave: (data: CrawlerConfigDTO) => Promise<boolean>;
  onTestRun?: (data: CrawlerConfigDTO) => void;
  onConfigActivated?: () => void;
}

export function CrawlerConfigDialog({
  open,
  onOpenChange,
  initialData,
  websites,
  categories,
  onSave,
  onTestRun
}: CrawlerConfigDialogProps) {
  // State for form fields
  const [formData, setFormData] = useState<Partial<CrawlerConfigDTO>>({
    code: '',
    crawlerWebsite: '',
    productCategory: '',
    startUrl: '',
    active: false,
    allItemsSel: '',
    titleSel: '',
    linkSel: '',
    priceSel: '',
    useNextPageButton: false,
    useInfiniteScroll: false,
    useUrlPageParameter: true,
    nextPageButtonSel: '',
    urlPageParameter: '',
    maxPages: 50,
    autoSchedule: false,
    autoScheduleEvery: 24
  });
  
  const [nextPageMethod, setNextPageMethod] = useState<string>('URL');
  const [submitted, setSubmitted] = useState(false);
  const [showAddWebsiteDialog, setShowAddWebsiteDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ code: '', name: '', url: '' });
  const [newCategory, setNewCategory] = useState({ code: '', name: '' });
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<CrawlerConfigDTO[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CrawlerConfigDTO | null>(null);
  const [localWebsites, setLocalWebsites] = useState<DropdownDTO[]>([]);
  const [localCategories, setLocalCategories] = useState<DropdownDTO[]>([]);

  // Reset form data and local dropdowns when the dialog opens with new data
  useEffect(() => {
    if (open) {
      // Initialize with props data first
      setLocalWebsites(websites);
      setLocalCategories(categories);
      
      // Fetch fresh dropdown data when the dialog opens
      const fetchDropdowns = async () => {
        try {
          const [websitesResponse, categoriesResponse] = await Promise.all([
            registryService.getWebsitesDropdown(),
            registryService.getCategoriesDropdown()
          ]);
          
          if (websitesResponse) {
            setLocalWebsites(websitesResponse);
          }
          
          if (categoriesResponse) {
            setLocalCategories(categoriesResponse);
          }
        } catch (error) {
          console.error('Error fetching dropdowns:', error);
        }
      };
      
      fetchDropdowns();
      
      if (initialData) {
        setFormData({
          ...initialData
        });
        
        // Set the correct pagination method
        if (initialData.useUrlPageParameter) {
          setNextPageMethod('URL');
        } else if (initialData.useNextPageButton) {
          setNextPageMethod('BUTTON');
        } else if (initialData.useInfiniteScroll) {
          setNextPageMethod('SCROLL');
        }
      } else {
        // Default values for new config
        setFormData({
          code: '',
          crawlerWebsite: '',
          productCategory: '',
          startUrl: '',
          active: false,
          allItemsSel: '',
          titleSel: '',
          linkSel: '',
          priceSel: '',
          useNextPageButton: false,
          useInfiniteScroll: false,
          useUrlPageParameter: true,
          nextPageButtonSel: '',
          urlPageParameter: '?page=',
          maxPages: 50,
          autoSchedule: false,
          autoScheduleEvery: 24
        });
        setNextPageMethod('URL');
      }
    }
  }, [initialData, open]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof CrawlerConfigDTO
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));

    // Website auto-detection from URL
    if (field === 'startUrl') {
      tryDetectWebsiteFromUrl(e.target.value);
    }
  };

  const handleNumberInputChange = (
    value: number | undefined, 
    field: keyof CrawlerConfigDTO
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextPageMethodChange = (value: string) => {
    setNextPageMethod(value);
    
    // Reset pagination-related fields
    setFormData(prev => ({
      ...prev,
      useUrlPageParameter: value === 'URL',
      useNextPageButton: value === 'BUTTON',
      useInfiniteScroll: value === 'SCROLL',
      urlPageParameter: value === 'URL' ? '?page=' : '',
      nextPageButtonSel: value === 'BUTTON' ? prev.nextPageButtonSel : '',
    }));
  };

  const handleSwitchChange = (checked: boolean, field: keyof CrawlerConfigDTO) => {
    // Don't allow activating a config directly in the dialog
    if (field === 'active' && !formData.active) {
      toast.info("Config must be activated via a successful test run");
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [field]: checked
    }));

    // Handle auto schedule toggle
    if (field === 'autoSchedule') {
      setFormData(prev => ({
        ...prev,
        autoScheduleEvery: checked ? 24 : undefined,
      }));
    }
  };

  const tryDetectWebsiteFromUrl = async (url: string) => {
    if (!url) return;
    
    try {
      // Extract domain from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Check if we have a matching website in the dropdown
      const matchedWebsite = websites.find(website => 
        domain.includes(website.code.toLowerCase())
      );
      
      if (matchedWebsite) {
        // Set the website
        setFormData(prev => ({
          ...prev,
          crawlerWebsite: matchedWebsite.code
        }));
        
        // Now check for existing templates
        try {
          // Use a filter to get configs for this website
          const existingConfigs = await crawlerConfigService.getAll({
            website: matchedWebsite.code,
            page: 0,
            size: 10
          });
          
          if (existingConfigs && existingConfigs.content && existingConfigs.content.length > 0) {
            // Store the available templates
            setAvailableTemplates(existingConfigs.content);
            // Open template selection dialog
            setTemplateDialogOpen(true);
          }
        } catch (error) {
          console.error('Error fetching templates:', error);
        }
      }
    } catch (error) {
      // Invalid URL, skip
      console.log("Invalid URL format");
    }
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;
    
    // Copy only the crawler-specific fields, excluding identifying information
    setFormData(prev => ({
      ...prev,
      allItemsSel: selectedTemplate.allItemsSel,
      titleSel: selectedTemplate.titleSel,
      linkSel: selectedTemplate.linkSel,
      priceSel: selectedTemplate.priceSel,
      useNextPageButton: selectedTemplate.useNextPageButton,
      nextPageButtonSel: selectedTemplate.nextPageButtonSel,
      useInfiniteScroll: selectedTemplate.useInfiniteScroll,
      useUrlPageParameter: selectedTemplate.useUrlPageParameter,
      urlPageParameter: selectedTemplate.urlPageParameter,
      maxPages: selectedTemplate.maxPages,
      autoSchedule: selectedTemplate.autoSchedule,
      autoScheduleEvery: selectedTemplate.autoScheduleEvery
    }));
    
    // Set the correct next page method
    if (selectedTemplate.useUrlPageParameter) {
      setNextPageMethod('URL');
    } else if (selectedTemplate.useNextPageButton) {
      setNextPageMethod('BUTTON');
    } else if (selectedTemplate.useInfiniteScroll) {
      setNextPageMethod('SCROLL');
    }
    
    // Close the dialog
    setTemplateDialogOpen(false);
    
    toast.success('Template applied successfully!');
  };

  const handleSave = async () => {
    setSubmitted(true);
    
    // Validation
    if (!formData.crawlerWebsite || 
        !formData.productCategory || 
        !formData.startUrl || 
        !formData.allItemsSel || 
        !formData.titleSel || 
        !formData.linkSel || 
        !formData.priceSel) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // Validate pagination settings
    if (formData.useNextPageButton && !formData.nextPageButtonSel) {
      toast.error("Next page button selector is required when using button pagination");
      return;
    }
    
    if (formData.useUrlPageParameter && !formData.urlPageParameter) {
      toast.error("URL page parameter is required when using URL pagination");
      return;
    }
    
    // Validate max pages
    if (!formData.maxPages || formData.maxPages <= 0 || formData.maxPages >= 1000) {
      toast.error("Max pages must be between 1 and 999");
      return;
    }
    
    // Validate auto schedule
    if (formData.autoSchedule && (!formData.autoScheduleEvery || formData.autoScheduleEvery < 1 || formData.autoScheduleEvery > 168)) {
      toast.error("Auto schedule interval must be between 1 and 168 hours");
      return;
    }
    
    // Save the data
    const success = await onSave(formData as CrawlerConfigDTO);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleSaveAndTestRun = async () => {
    setSubmitted(true);
    const success = await onSave(formData as CrawlerConfigDTO);
    if (success && onTestRun) {
      onTestRun(formData as CrawlerConfigDTO);
    }
  };

  // Website dialog functions
  const openAddWebsiteDialog = () => {
    setNewWebsite({ code: '', name: '', url: '' });
    setShowAddWebsiteDialog(true);
  };

  const handleAddWebsite = async () => {
    if (!newWebsite.code || !newWebsite.name || !newWebsite.url) {
      toast.error("All fields are required");
      return;
    }
    
    try {
      // Add the new website
      const response = await registryService.addWebsite(newWebsite);
      
      // Close the dialog
      setShowAddWebsiteDialog(false);
      
      // Create a new dropdown item from the response
      const newWebsiteItem: DropdownDTO = {
        code: response.code || newWebsite.code,
        name: response.name || newWebsite.name
      };
      
      // Add the new website to the local dropdown list
      setLocalWebsites(prev => [...prev, newWebsiteItem]);
      
      // Select the new website in the form
      setFormData(prev => ({
        ...prev,
        crawlerWebsite: newWebsiteItem.code
      }));
      
      toast.success("Website added successfully");
    } catch (error) {
      console.error('Error adding website:', error);
      toast.error("Failed to add website");
    }
  };

  // Category dialog functions
  const openAddCategoryDialog = () => {
    setNewCategory({ code: '', name: '' });
    setShowAddCategoryDialog(true);
  };

  const handleAddCategory = async () => {
    if (!newCategory.code || !newCategory.name) {
      toast.error("All fields are required");
      return;
    }
    
    try {
      // Add the new category
      const response = await registryService.addCategory(newCategory);
      
      // Close the dialog
      setShowAddCategoryDialog(false);
      
      // Create a new dropdown item from the response
      const newCategoryItem: DropdownDTO = {
        code: response.code || newCategory.code,
        name: response.name || newCategory.name
      };
      
      // Add the new category to the local dropdown list
      setLocalCategories(prev => [...prev, newCategoryItem]);
      
      // Select the new category in the form
      setFormData(prev => ({
        ...prev,
        productCategory: newCategoryItem.code
      }));
      
      toast.success("Category added successfully");
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error("Failed to add category");
    }
  };

  // Function to update active status from TestRunDialog
  const updateActiveStatus = () => {
    setFormData(prev => ({
      ...prev,
      active: true
    }));
  };
  
  // Expose the function through an imperative handle
  useEffect(() => {
    // Attach the updateActiveStatus to the window for TestRunDialog to call
    if (open && formData.code) {
      (window as any).updateCrawlerConfigActiveStatus = updateActiveStatus;
    }
    
    return () => {
      // Clean up when component unmounts or dialog closes
      if ((window as any).updateCrawlerConfigActiveStatus === updateActiveStatus) {
        delete (window as any).updateCrawlerConfigActiveStatus;
      }
    };
  }, [open, formData.code]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{formData.code ? `Edit Config: ${formData.code}` : 'New Crawler Config'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Code and Active in same row */}
            <div className="flex justify-between gap-4">
              <div className="flex-grow">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => handleInputChange(e, 'code')}
                  disabled={true}
                  className="mt-1"
                />
              </div>
              
              <div className="w-24">
                <Label htmlFor="active" className="text-right block">Active</Label>
                <div className="flex items-center h-10 mt-1 justify-end">
                  <Switch
                    id="active"
                    checked={formData.active || false}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'active')}
                    className={!formData.active ? "cursor-not-allowed opacity-70" : ""}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="startUrl">Start URL</Label>
              <Input
                id="startUrl"
                value={formData.startUrl || ''}
                onChange={(e) => handleInputChange(e, 'startUrl')}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-between gap-4">
              <div className="w-1/2">
                <Label htmlFor="website">Website</Label>
                <div className="flex gap-2 items-center mt-1">
                  <div className="flex-grow">
                    <Select
                      value={formData.crawlerWebsite || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, crawlerWebsite: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select website" />
                      </SelectTrigger>
                      <SelectContent>
                        {localWebsites.map((website) => (
                          <SelectItem key={website.code} value={website.code}>
                            {website.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="icon" onClick={openAddWebsiteDialog} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="w-1/2">
                <Label htmlFor="category">Category</Label>
                <div className="flex gap-2 items-center mt-1">
                  <div className="flex-grow">
                    <Select
                      value={formData.productCategory || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, productCategory: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {localCategories.map((category) => (
                          <SelectItem key={category.code} value={category.code}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="icon" onClick={openAddCategoryDialog} type="button">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between gap-4">
              <div className="w-1/2">
                <Label htmlFor="allItemsSel">Item Selector</Label>
                <Input
                  id="allItemsSel"
                  value={formData.allItemsSel || ''}
                  onChange={(e) => handleInputChange(e, 'allItemsSel')}
                  className="mt-1"
                />
              </div>
              
              <div className="w-1/2">
                <Label htmlFor="titleSel">Title Selector</Label>
                <Input
                  id="titleSel"
                  value={formData.titleSel || ''}
                  onChange={(e) => handleInputChange(e, 'titleSel')}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-between gap-4">
              <div className="w-1/2">
                <Label htmlFor="linkSel">Link Selector</Label>
                <Input
                  id="linkSel"
                  value={formData.linkSel || ''}
                  onChange={(e) => handleInputChange(e, 'linkSel')}
                  className="mt-1"
                />
              </div>
              
              <div className="w-1/2">
                <Label htmlFor="priceSel">Price Selector</Label>
                <Input
                  id="priceSel"
                  value={formData.priceSel || ''}
                  onChange={(e) => handleInputChange(e, 'priceSel')}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-between gap-4">
              <div className="w-1/2">
                <Label>Next Page Method</Label>
                <RadioGroup 
                  value={nextPageMethod} 
                  onValueChange={handleNextPageMethodChange}
                  className="flex flex-col space-y-1 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="URL" id="url" />
                    <Label htmlFor="url">URL Parameter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BUTTON" id="button" />
                    <Label htmlFor="button">Next Page Button</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SCROLL" id="scroll" />
                    <Label htmlFor="scroll">Infinite Scroll</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="w-1/2">
                {nextPageMethod === 'URL' && (
                  <div>
                    <Label htmlFor="urlPageParameter">URL Page Parameter</Label>
                    <Input
                      id="urlPageParameter"
                      value={formData.urlPageParameter || ''}
                      onChange={(e) => handleInputChange(e, 'urlPageParameter')}
                      className="mt-1"
                    />
                  </div>
                )}
                
                {nextPageMethod === 'BUTTON' && (
                  <div>
                    <Label htmlFor="nextPageButtonSel">Next Page Button Selector</Label>
                    <Input
                      id="nextPageButtonSel"
                      value={formData.nextPageButtonSel || ''}
                      onChange={(e) => handleInputChange(e, 'nextPageButtonSel')}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Max Pages row */}
            <div className="flex justify-between gap-4">
              <div className="w-1/2">
                <Label htmlFor="maxPages">Max Pages</Label>
                <Input
                  id="maxPages"
                  type="number"
                  value={formData.maxPages?.toString() || '50'}
                  onChange={(e) => handleNumberInputChange(parseInt(e.target.value), 'maxPages')}
                  min={1}
                  max={999}
                  className="mt-1"
                />
                {submitted && (!formData.maxPages || formData.maxPages <= 0 || formData.maxPages >= 1000) && (
                  <p className="text-sm text-red-500 mt-1">Max pages must be between 1 and 999</p>
                )}
              </div>
              
              <div className="w-1/2">
                {/* Empty for layout consistency */}
              </div>
            </div>
            
            {/* Auto Schedule row */}
            <div className="flex justify-between gap-4">
              <div className="w-full flex justify-between">
                <div className="w-1/2 flex flex-col">
                  <Label htmlFor="autoSchedule" className="mb-1">Auto Schedule</Label>
                  <div className="h-10 flex items-center">
                    <Switch
                      id="autoSchedule"
                      checked={formData.autoSchedule || false}
                      onCheckedChange={(checked) => handleSwitchChange(checked, 'autoSchedule')}
                    />
                  </div>
                </div>
                
                <div className="w-1/2">
                  {formData.autoSchedule && (
                    <div>
                      <Label htmlFor="autoScheduleEvery">Every (hours)</Label>
                      <Input
                        id="autoScheduleEvery"
                        type="number"
                        value={formData.autoScheduleEvery?.toString() || '24'}
                        onChange={(e) => handleNumberInputChange(parseInt(e.target.value), 'autoScheduleEvery')}
                        min={1}
                        max={168}
                        className="mt-1"
                      />
                      {submitted && (!formData.autoScheduleEvery || formData.autoScheduleEvery < 1 || formData.autoScheduleEvery > 168) && (
                        <p className="text-sm text-red-500 mt-1">Hours must be between 1 and 168</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
            <Button type="button" onClick={handleSaveAndTestRun}>
              Save and Test Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Website Dialog */}
      <Dialog open={showAddWebsiteDialog} onOpenChange={setShowAddWebsiteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Website</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="websiteUrl">URL</Label>
              <Input
                id="websiteUrl"
                value={newWebsite.url}
                onChange={(e) => {
                  setNewWebsite(prev => ({ ...prev, url: e.target.value }));
                  // Try to extract domain for code/name
                  if (e.target.value) {
                    try {
                      const urlObj = new URL(e.target.value);
                      const domain = urlObj.hostname;
                      const possibleCode = domain;
                      const possibleName = domain.split('.')[0];
                      
                      setNewWebsite(prev => ({
                        ...prev,
                        code: possibleCode,
                        name: possibleName.charAt(0).toUpperCase() + possibleName.slice(1)
                      }));
                    } catch (error) {
                      // Invalid URL, skip
                    }
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="websiteCode">Code</Label>
              <Input
                id="websiteCode"
                value={newWebsite.code}
                onChange={(e) => setNewWebsite(prev => ({ ...prev, code: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="websiteName">Name</Label>
              <Input
                id="websiteName"
                value={newWebsite.name}
                onChange={(e) => setNewWebsite(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWebsiteDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddWebsite}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="categoryCode">Code</Label>
              <Input
                id="categoryCode"
                value={newCategory.code}
                onChange={(e) => {
                  setNewCategory(prev => ({ ...prev, code: e.target.value }));
                  if (e.target.value) {
                    // Auto-generate name from code
                    const name = e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1);
                    setNewCategory(prev => ({ ...prev, name }));
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="categoryName">Name</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddCategory}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Template Selection Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Use Existing Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              We found existing configurations for this website. 
              Would you like to use one as a template?
            </p>
            
            <div className="border rounded-md max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Select</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableTemplates.map(template => (
                    <TableRow 
                      key={template.code}
                      className={selectedTemplate?.code === template.code ? "bg-muted/50" : ""}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={selectedTemplate?.code === template.code ? "bg-primary text-primary-foreground" : ""}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          Use
                        </Button>
                      </TableCell>
                      <TableCell>{template.code}</TableCell>
                      <TableCell>{template.productCategory}</TableCell>
                      <TableCell>{template.active ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyTemplate} disabled={!selectedTemplate}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 