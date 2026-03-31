import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { useProject } from '@/hooks/useProjects';
import { updateProject } from '@/services/projectService';

const styleOptions = ['Modern', 'Contemporary', 'Traditional', 'Minimalist', 'Industrial', 'Scandinavian', 'Bohemian', 'Art Deco'];

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: project, isLoading } = useProject(projectId);

  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('residential');
  const [address, setAddress] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [familySize, setFamilySize] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [specialReqs, setSpecialReqs] = useState('');
  const [notes, setNotes] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize form when project loads
  if (project && !initialized) {
    setName(project.name);
    setProjectType(project.project_type);
    setAddress(project.address || '');
    setTotalArea(project.total_area_sqft?.toString() || '');
    setBudgetMin(project.budget_min?.toString() || '');
    setBudgetMax(project.budget_max?.toString() || '');
    setFamilySize(project.family_size?.toString() || '');
    setStyles(project.style_preferences || []);
    setSpecialReqs(project.special_requirements || '');
    setNotes(project.notes || '');
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateProject(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${projectId}`);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name,
      project_type: projectType,
      address: address || undefined,
      total_area_sqft: totalArea ? Number(totalArea) : undefined,
      budget_min: budgetMin ? Number(budgetMin) : undefined,
      budget_max: budgetMax ? Number(budgetMax) : undefined,
      family_size: familySize ? Number(familySize) : undefined,
      style_preferences: styles,
      special_requirements: specialReqs || undefined,
      notes: notes || undefined,
    });
  };

  const toggleStyle = (s: string) => {
    setStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  if (isLoading) {
    return <PageWrapper><div className="flex justify-center py-20"><span className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div></PageWrapper>;
  }

  if (!project) {
    return <PageWrapper><p className="text-gray-500">Project not found</p></PageWrapper>;
  }

  return (
    <PageWrapper>
      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4" onClick={() => navigate(`/projects/${projectId}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to Project
      </button>

      <GlassCard>
        <h2 className="text-xl font-semibold mb-6">Edit Project</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatedInput label="Project Name *" value={name} onChange={(e) => setName(e.target.value)} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm bg-white" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>

          <AnimatedInput label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatedInput label="Total Area (sqft)" type="number" value={totalArea} onChange={(e) => setTotalArea(e.target.value)} />
            <AnimatedInput label="Budget Min (₹)" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            <AnimatedInput label="Budget Max (₹)" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>

          <AnimatedInput label="Family Size" type="number" value={familySize} onChange={(e) => setFamilySize(e.target.value)} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Style Preferences</label>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((s) => (
                <button key={s} type="button" onClick={() => toggleStyle(s)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${styles.includes(s) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requirements</label>
            <textarea className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm resize-none" rows={3} value={specialReqs} onChange={(e) => setSpecialReqs(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-sm resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3">
            <GradientButton variant="secondary" type="button" onClick={() => navigate(`/projects/${projectId}`)}>Cancel</GradientButton>
            <GradientButton type="submit" isLoading={mutation.isPending}>Save Changes</GradientButton>
          </div>
        </form>
      </GlassCard>
    </PageWrapper>
  );
}
