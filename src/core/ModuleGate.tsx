import type { ReactNode } from 'react';

import { getModule } from '@/core/modules';
import { ModuleUnavailable } from '@/core/ModuleUnvailable';
import { useI18n } from '@/i18n';

export function ModuleGate({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { t } = useI18n();

  const module = getModule(id);

  if (!module || module.status === 'active') {
    return <>{children}</>;
  }

  return (
    <ModuleUnavailable
      kind={
        module.status === 'maintenance'
          ? 'maintenance'
          : 'soon'
      }
      title={`${t(module.title)} ${t(module.sub)}`}
    />
  );
}