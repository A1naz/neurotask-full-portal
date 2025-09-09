import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProviderCard from '@/components/MultiChat/ProviderCard';

const SortableProviderCard = ({ provider, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: provider });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ProviderCard
      ref={setNodeRef}
      style={style}
      provider={provider}
      dragHandleListeners={listeners}
      {...attributes}
      {...props}
    />
  );
};

export default SortableProviderCard;


