import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnitDirectory } from '@/components/units/UnitDirectory';

export function UnitsPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Units Directory</h1>
        <Button onClick={() => navigate('/units/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>
      <UnitDirectory />
    </div>
  );
}
