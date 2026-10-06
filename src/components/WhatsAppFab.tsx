import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '../config'

export default function WhatsAppFab() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gold-soft/50 bg-paper/95 text-gold shadow-lg backdrop-blur transition-colors hover:bg-gold hover:text-paper"
    >
      <MessageCircle size={20} />
    </a>
  )
}
