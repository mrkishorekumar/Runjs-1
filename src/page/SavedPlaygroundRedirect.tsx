import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getCode } from '../db/operations';
import PageSkeleton from '../components/skeletons/PageSkeleton';
import { normalizePlaygroundType } from '../hook/usePlaygroundPersistence';

export default function SavedPlaygroundRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let isMounted = true;
    async function resolvePlayground() {
      try {
        const item = await getCode(id as string);
        if (!isMounted) return;
        if (item && !item.isDelete) {
          const type = normalizePlaygroundType(item.language || item.tag);
          if (type) {
            navigate(`/${type}/${item.id}`, { replace: true });
            return;
          }
        }
        navigate('/404', { replace: true });
      } catch (err) {
        console.error('Failed to resolve playground by ID:', err);
        if (isMounted) {
          navigate('/404', { replace: true });
        }
      }
    }

    resolvePlayground();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  return <PageSkeleton />;
}
