"use client"

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/translations';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HandwrittenMessage() {
  const t = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [name, setName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' as 'success' | 'error' | 'info' | '' });
  const [writtenText, setWrittenText] = useState('');

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    setCtx(context);
  }, []);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setMessage({ text: t('messageError'), type: 'error' });
      return;
    }

    if (!writtenText.trim()) {
      setMessage({ text: t('messageError'), type: 'error' });
      return;
    }

    setIsSending(true);
    setMessage({ text: t('sendingMessage'), type: 'info' });

    try {
      // Create form data
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('message', writtenText.trim());
      formData.append('textMessage', writtenText.trim());

      // Send data to API route
      const response = await fetch('/api/send-email', {
        method: 'POST',
        body: formData,
      });

      // Try to parse JSON; if not JSON, fall back to text for better error visibility
      const contentType = response.headers.get('content-type') || '';
      let responseData: any = null;
      if (contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          const rawText = await response.text().catch(() => '');
          responseData = { raw: rawText };
        }
      } else {
        const rawText = await response.text().catch(() => '');
        responseData = { raw: rawText };
      }

      if (!response.ok) {
        console.error('Server error:', response.status, response.statusText, responseData);
        const msg = responseData?.message
          || responseData?.error
          || (typeof responseData?.raw === 'string' && responseData.raw.trim() ? responseData.raw : '')
          || 'Failed to send message';
        throw new Error(msg);
      }

      if (!responseData.success) {
        console.error('API error:', responseData);
        throw new Error(responseData.message || 'Message sending failed');
      }

      setMessage({ 
        text: t('messageSent'),
        type: 'success' as const
      });
      
      // Reset form if successful
      setWrittenText('');
      setName('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : t('messageError'), 
        type: 'error' 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section 
      id="message" 
      className="relative py-20 px-4 md:py-32 bg-gradient-to-b from-transparent via-accent/5 to-transparent select-none overflow-hidden"
      style={{
        clipPath: 'polygon(0 0%, 100% 5%, 100% 100%, 0% 95%)',
      }}
    >
      <div className="max-w-6xl mx-auto w-full">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1] 
              }
            }
          }}
        >
          <h2 className="font-luxury text-4xl md:text-5xl font-medium mb-3 text-foreground">{t('writeUsMessage')}</h2>
          <p className="text-muted-foreground text-lg md:text-xl text-center mb-4">{t('writeUsDescription')}</p>
          <div className="w-24 h-1 bg-accent mx-auto"></div>
        </motion.div>
        
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="relative bg-gradient-to-br from-card/95 via-card/90 to-accent/10 backdrop-blur-sm border-4 border-accent/40 p-6 sm:p-8 md:p-12 shadow-2xl"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            style={{
              clipPath: 'polygon(8% 0%, 92% 0%, 100% 8%, 100% 92%, 92% 100%, 8% 100%, 0% 92%, 0% 8%)',
            }}
          >
            <form onSubmit={sendEmail} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Left side: Textarea */}
              <div className="md:col-span-1 flex flex-col gap-3">
                <label
                  htmlFor="message-input"
                  className="block text-sm font-medium text-muted-foreground text-left"
                >
                  {t('yourMessage')}
                </label>
                <Textarea
                  id="message-input"
                  value={writtenText}
                  onChange={(e) => setWrittenText(e.target.value)}
                  placeholder={t('writeYourMessage')}
                  rows={10}
                  className="min-h-[220px] bg-background/80"
                  required
                />
              </div>

              {/* Right side: Name and Actions */}
              <div className="md:col-span-1 flex flex-col justify-between gap-4">
                <div>
                  <label
                    htmlFor="name-input"
                    className="block text-sm font-medium text-muted-foreground mb-2 text-left"
                  >
                    {t('yourName')}
                  </label>
                  <Input
                    id="name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('yourName')}
                    className="h-11 bg-background/80"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={() => setWrittenText('')}
                    disabled={isSending || !writtenText.trim()}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {t('clearDrawing')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 justify-center bg-accent text-white hover:bg-accent/90 disabled:opacity-60 text-base md:text-lg"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    )}
                    {isSending ? t('sendingMessage') : t('sendMessage')}
                  </Button>
                </div>
              </div>

              {message.text && (
                <div className="md:col-span-2 mt-4">
                  <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    <AlertDescription>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}