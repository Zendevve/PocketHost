import { useState, useCallback } from 'react';
import ServerProcess from '../../modules/server-process';

export function usePlayerActions() {
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useCallback(async (command: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await ServerProcess.sendCommand(command);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const kick = useCallback(
    async (username: string, reason?: string): Promise<boolean> => {
      const cmd = reason ? `kick ${username} ${reason}` : `kick ${username}`;
      return dispatch(cmd);
    },
    [dispatch]
  );

  const ban = useCallback(
    async (username: string, reason?: string): Promise<boolean> => {
      const cmd = reason ? `ban ${username} ${reason}` : `ban ${username}`;
      return dispatch(cmd);
    },
    [dispatch]
  );

  const banIp = useCallback(
    async (target: string, reason?: string): Promise<boolean> => {
      const cmd = reason ? `ban-ip ${target} ${reason}` : `ban-ip ${target}`;
      return dispatch(cmd);
    },
    [dispatch]
  );

  const pardon = useCallback(
    async (username: string): Promise<boolean> => {
      return dispatch(`pardon ${username}`);
    },
    [dispatch]
  );

  const pardonIp = useCallback(
    async (ip: string): Promise<boolean> => {
      return dispatch(`pardon-ip ${ip}`);
    },
    [dispatch]
  );

  const op = useCallback(
    async (username: string): Promise<boolean> => {
      return dispatch(`op ${username}`);
    },
    [dispatch]
  );

  const deop = useCallback(
    async (username: string): Promise<boolean> => {
      return dispatch(`deop ${username}`);
    },
    [dispatch]
  );

  const setGamemode = useCallback(
    async (
      username: string,
      mode: 'survival' | 'creative' | 'adventure' | 'spectator'
    ): Promise<boolean> => {
      const validModes = ['survival', 'creative', 'adventure', 'spectator'];
      if (!validModes.includes(mode)) return false;
      return dispatch(`gamemode ${mode} ${username}`);
    },
    [dispatch]
  );

  return {
    isLoading,
    kick,
    ban,
    banIp,
    pardon,
    pardonIp,
    op,
    deop,
    setGamemode,
  };
}
