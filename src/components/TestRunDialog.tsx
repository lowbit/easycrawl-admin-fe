import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CrawlerConfigDTO } from '@/services/crawlerConfigService';
import { jobService, JobDTO, JobErrorDTO } from '@/services/jobService';
import { toast } from 'sonner';
import { crawlerConfigService } from '@/services/crawlerConfigService';
import { CheckCircle2, CircleAlert, Clock, Loader2, ExternalLink } from 'lucide-react';

interface TestRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CrawlerConfigDTO | undefined;
  isTestRun?: boolean; // Whether this is a test run (true) or a full run (false)
  onEditConfig?: () => void;
  onConfigActivated?: () => void;
}

// Job states for the stepper
type JobState = 'Created' | 'Running' | 'Finished' | 'Failed';

export function TestRunDialog({
  open,
  onOpenChange,
  config,
  isTestRun = true, // Default to test run if not specified
  onEditConfig,
  onConfigActivated
}: TestRunDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: 'success' | 'error' | 'pending' | null;
    message: string;
  }>({ status: null, message: '' });
  const [jobId, setJobId] = useState<number | null>(null);
  const [job, setJob] = useState<JobDTO | null>(null);
  const [jobErrors, setJobErrors] = useState<JobErrorDTO[]>([]);
  const [currentState, setCurrentState] = useState<JobState>('Created');
  const pollingInterval = useRef<number | null>(null);

  // Clean up on unmount or when dialog closes
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // When dialog closes, stop polling and reset state
  useEffect(() => {
    if (!open && pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    
    // Reset all state when dialog closes
    if (!open) {
      setTimeout(() => {
        // Use setTimeout to avoid updating state during render
        setResult({ status: null, message: '' });
        setJobId(null);
        setJob(null);
        setJobErrors([]);
        setCurrentState('Created');
        setLoading(false);
      }, 300); // Short delay to ensure dialog is fully closed
    }
  }, [open]);

  // Start test run automatically when dialog is opened
  useEffect(() => {
    // Only start a new test run when the dialog is freshly opened
    // and we don't already have a job in progress or completed
    if (open && config && !jobId && result.status === null) {
      handleTestRun();
    }
  }, [open, config, jobId, result.status]);

  const pollJobStatus = (id: number) => {
    // Clear any existing interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Set up polling interval (every 1 second)
    pollingInterval.current = window.setInterval(async () => {
      try {
        const jobData = await jobService.getById(id.toString());
        setJob(jobData);

        // Update job state based on status
        if (jobData.status === 'Created') {
          setCurrentState('Created');
          setResult({ 
            status: 'pending', 
            message: 'Job created, waiting to start...' 
          });
        } else if (jobData.status === 'Running') {
          setCurrentState('Running');
          setResult({ 
            status: 'pending', 
            message: 'Test run in progress...' 
          });
        } else if (jobData.status === 'Finished') {
          setCurrentState('Finished');
          setResult({ 
            status: 'success', 
            message: `${isTestRun ? 'Test run' : 'Full run'} completed successfully!${isTestRun && !config?.active ? ' Config can now be activated.' : ''}` 
          });
          clearInterval(pollingInterval.current!);
          pollingInterval.current = null;
          setLoading(false);
        } else if (jobData.status === 'Failed') {
          setCurrentState('Failed');
          setResult({ 
            status: 'error', 
            message: `${isTestRun ? 'Test run' : 'Full run'} failed. See details below.` 
          });
          
          // Get job errors
          try {
            if (jobData.id) {
              const errors = await jobService.getErrors(jobData.id);
              if (errors && errors.length > 0) {
                setJobErrors(errors);
              } else if (jobData.errorMessage) {
                // Create a generic error entry if we only have the error message
                setJobErrors([{
                  id: 0,
                  jobId: jobData.id,
                  error: jobData.errorMessage,
                  source: '',
                  category: '',
                  jobType: jobData.jobType || '',
                  created: ''
                }]);
              }
            }
          } catch (error) {
            console.error('Failed to fetch job errors:', error);
          }
          
          clearInterval(pollingInterval.current!);
          pollingInterval.current = null;
          setLoading(false);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setResult({ 
          status: 'error', 
          message: 'Failed to get job status. Please try again.' 
        });
        clearInterval(pollingInterval.current!);
        pollingInterval.current = null;
        setLoading(false);
      }
    }, 1000);
  };

  const handleTestRun = async () => {
    if (!config) return;

    try {
      setLoading(true);
      setCurrentState('Created');
      setJobErrors([]);
      setResult({ status: 'pending', message: `Creating ${isTestRun ? 'test' : 'full'} run job...` });
      
      const newJob = await jobService.createCrawlerJob(config.code, isTestRun, config.crawlerWebsite);
      setJobId(newJob.id);
      
      // Start polling for status
      pollJobStatus(newJob.id);
    } catch (error) {
      console.error('Error starting job:', error);
      setResult({ 
        status: 'error', 
        message: `Failed to create ${isTestRun ? 'test' : 'full'} run job.` 
      });
      setLoading(false);
    }
  };

  const handleActivateConfig = async () => {
    if (!config) return;
    
    // Only allow activation if the job completed successfully
    if (job?.status !== 'Finished') {
      toast.error('Cannot activate config until test run is successfully completed');
      return;
    }

    try {
      setLoading(true);
      
      // Create updated config with active=true
      const updatedConfig = { ...config, active: true };
      
      // Update the config in the database via API
      await crawlerConfigService.update(config.code, updatedConfig);
      
      toast.success('Config activated successfully!');
      
      // Update the active status in the CrawlerConfigDialog if it's open
      if ((window as any).updateCrawlerConfigActiveStatus) {
        (window as any).updateCrawlerConfigActiveStatus();
      }
      
      if (onConfigActivated) {
        onConfigActivated();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error activating config:', error);
      toast.error('Failed to activate config.');
      setLoading(false);
    }
  };

  // Determine if Activate button should be enabled
  const canActivate = job?.status === 'Finished' && !config?.active && isTestRun;

  // Handle dialog close properly
  const handleDialogClose = (isOpen: boolean) => {
    // If closing the dialog, do cleanup
    if (!isOpen) {
      // If we're in the middle of a job, don't immediately close
      if (loading && result.status === 'pending') {
        if (confirm('A test run is in progress. Are you sure you want to close?')) {
          // If confirmed, clean up and close
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
          onOpenChange(false);
        } else {
          // If not confirmed, keep dialog open
          return;
        }
      } else {
        // Normal close if no job in progress
        onOpenChange(false);
      }
    } else {
      // Opening the dialog
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isTestRun ? 'Test Run' : 'Full Run'}: {config?.code}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Job Status Stepper */}
          <div className="w-full">
            <div className="flex justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentState === 'Created' ? 'border-blue-500 bg-blue-50 text-blue-500' : 
                  currentState === 'Running' || currentState === 'Finished' || currentState === 'Failed' ? 
                    'border-green-500 bg-green-50 text-green-500' : 'border-gray-300 text-gray-300'
                }`}>
                  {currentState === 'Created' ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs mt-1">Created</span>
              </div>
              
              <div className="w-full mx-2 flex items-center">
                <div className={`h-1 w-full ${
                  currentState === 'Running' || currentState === 'Finished' || currentState === 'Failed' ? 
                    'bg-green-500' : 'bg-gray-200'
                }`}></div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentState === 'Running' ? 'border-blue-500 bg-blue-50 text-blue-500' : 
                  currentState === 'Finished' || currentState === 'Failed' ? 
                    'border-green-500 bg-green-50 text-green-500' : 'border-gray-300 text-gray-300'
                }`}>
                  {currentState === 'Running' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : currentState === 'Finished' || currentState === 'Failed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs mt-1">Running</span>
              </div>
              
              <div className="w-full mx-2 flex items-center">
                <div className={`h-1 w-full ${
                  currentState === 'Finished' || currentState === 'Failed' ? 
                    'bg-green-500' : 'bg-gray-200'
                }`}></div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentState === 'Finished' ? 'border-green-500 bg-green-50 text-green-500' : 
                  currentState === 'Failed' ? 'border-red-500 bg-red-50 text-red-500' : 
                    'border-gray-300 text-gray-300'
                }`}>
                  {currentState === 'Finished' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : currentState === 'Failed' ? (
                    <CircleAlert className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs mt-1">
                  {currentState === 'Failed' ? 'Failed' : 'Finished'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status Information */}
          <div className="space-y-4">
            {result.status === 'pending' && (
              <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                <p className="font-medium">In Progress</p>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            )}
            
            {result.status === 'success' && (
              <div className="p-4 bg-green-50 text-green-700 rounded-md">
                <p className="font-medium">Success!</p>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            )}
            
            {result.status === 'error' && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            )}
            
            {/* Job Details */}
            {job && (
              <div className="text-sm text-muted-foreground border rounded-md p-4">
                <p className="font-medium mb-2">Job Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <p><span className="font-medium">ID:</span> {job.id}</p>
                  <p><span className="font-medium">Status:</span> {job.status}</p>
                  {job.startedAt && <p><span className="font-medium">Started:</span> {new Date(job.startedAt).toLocaleTimeString()}</p>}
                  {job.finishedAt && <p><span className="font-medium">Finished:</span> {new Date(job.finishedAt).toLocaleTimeString()}</p>}
                </div>
              </div>
            )}
            
            {/* Error Details */}
            {currentState === 'Failed' && jobErrors.length > 0 && (
              <div className="border border-red-200 rounded-md p-4 bg-red-50">
                <p className="font-medium text-red-700 mb-2">Error Details ({jobErrors.length})</p>
                <div className="max-h-[250px] overflow-y-auto pr-2">
                  <ul className="list-none pl-0 space-y-3 text-sm text-red-700">
                    {jobErrors.map((error, index) => (
                      <li key={index} className="border-t border-red-200 pt-2 first:border-t-0 first:pt-0">
                        <p className="font-medium flex items-start">
                          <CircleAlert className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{error.error}</span>
                        </p>
                        {error.source && (
                          <a 
                            href={error.source} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center mt-1"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            <span className="text-xs truncate">{error.source}</span>
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-end">
          <div className="flex gap-2">
            {result.status === 'success' && isTestRun && (
              <Button 
                onClick={handleActivateConfig} 
                disabled={!canActivate}
                title={config?.active ? "Config is already active" : ""}
              >
                {config?.active ? "Already Active" : "Activate Config"}
              </Button>
            )}
            
            {result.status === 'error' && onEditConfig && (
              <Button variant="outline" onClick={onEditConfig}>
                Edit Configuration
              </Button>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 