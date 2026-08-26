import { useEffect, useState } from 'react';

import { fetchCreditArtifact } from '../services/api';
import useArtifactAction from './useArtifactAction';


export default function useCreditArtifactResource(
  applicationId,
  application,
  artifactKey,
  { actionKey, capability, refreshKey } = {}
) {
  const { artifact, action } = useArtifactAction(application, artifactKey, { actionKey, capability });
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadDetail = async () => {
      if (!applicationId || !artifact) {
        if (isActive) {
          setDetail(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchCreditArtifact(applicationId, artifactKey);
        if (isActive) {
          setDetail(data);
        }
      } catch (artifactError) {
        if (isActive) {
          setError(artifactError);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      isActive = false;
    };
  }, [applicationId, artifact, artifactKey, refreshKey]);

  return {
    artifact,
    action,
    detail,
    loading,
    error,
  };
}
