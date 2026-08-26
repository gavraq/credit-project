import { useMemo } from 'react';

import {
  findArtifactActionByCapability,
  findArtifactActionByKey,
  findArtifactByKey,
} from '../services/api';


export default function useArtifactAction(application, artifactKey, { actionKey, capability } = {}) {
  return useMemo(() => {
    const artifact = findArtifactByKey(application, artifactKey);
    if (!artifact) {
      return { artifact: null, action: null };
    }

    let action = null;
    if (actionKey) {
      action = findArtifactActionByKey(artifact, actionKey);
    } else if (capability) {
      action = findArtifactActionByCapability(artifact, capability);
    }

    return { artifact, action };
  }, [application, artifactKey, actionKey, capability]);
}
