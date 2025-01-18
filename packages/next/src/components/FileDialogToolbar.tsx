import {
	BanIcon,
	CircleSlashIcon,
	DownloadIcon,
	GalleryThumbnailsIcon,
	LinkIcon,
	SquareArrowOutUpRight,
	Trash2Icon
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Button } from './ui/button';
import { useEffect, type PropsWithChildren } from 'react';
import { MessageType, type FilePropsType, type FileWithAdditionalData } from '@/types';
import { useCopyToClipboard, useMediaQuery } from 'usehooks-ts';
import { buttonVariants } from '@/styles/button';
import {
	allowFile,
	deleteFile,
	deleteFileAsAdmin,
	quarantineFile,
	regenerateThumbnail
} from '@/actions/FileDialogActions';
import { toast } from 'sonner';
import { FileDialogInformation } from './FileDialogInformation';
import { useSetAtom } from 'jotai';
import { confirmationDialogAtom } from '@/lib/atoms/dialogs/confirmationDialog';
import { isDialogOpenAtom } from '@/lib/atoms/fileDialog';
import { useServerAction } from '@/hooks/useServerAction';
import { useQueryClient } from '@tanstack/react-query';

export const FileDialogToolbar = ({
	file,
	type
}: PropsWithChildren<{ readonly file: FileWithAdditionalData; readonly type: FilePropsType }>) => {
	const [_, copy] = useCopyToClipboard();
	const regenerateThumbailWithUuid = regenerateThumbnail.bind(null, file.uuid);
	const isMobile = useMediaQuery('(max-width: 768px)');

	return (
		<div className="fixed md:-right-12 -top-12 h-10 z-[60] w-screen !pointer-events-auto bg-black flex flex-row justify-center items-center gap-4 md:gap-1 pr-2">
			<input type="text" className={isMobile ? 'hidden' : 'opacity-0 pointer-events-none select-none w-0'} />
			<Tooltip content="Download">
				<a
					href={`/api/file/${file.uuid}/download`}
					rel="noopener noreferrer"
					className={buttonVariants({ variant: 'ghost', size: 'icon' })}
				>
					<DownloadIcon className="h-5 w-5" />
				</a>
			</Tooltip>

			{type === 'publicAlbum' ? null : <FileDialogInformation file={file} type={type} />}

			<Tooltip content="Open in new tab">
				<a
					href={file.url}
					target="_blank"
					rel="noopener noreferrer"
					className={buttonVariants({ variant: 'ghost', size: 'icon' })}
				>
					<SquareArrowOutUpRight className="h-5 w-5" />
				</a>
			</Tooltip>

			<Tooltip content="Copy link">
				<Button size={'icon'} variant={'ghost'} onClick={() => void copy(file.url)}>
					<LinkIcon className="h-5 w-5" />
				</Button>
			</Tooltip>

			{type === 'publicAlbum' ? null : (
				<>
					<Tooltip content="Regenerate thumbnail">
						<Button
							size={'icon'}
							variant={'ghost'}
							onClick={async () => {
								await regenerateThumbailWithUuid();
								toast.success('Thumbnail regenerated');
							}}
						>
							<GalleryThumbnailsIcon className="h-5 w-5" />
						</Button>
					</Tooltip>

					<DeleteFileButton uuid={file.uuid} type={type} />
				</>
			)}

			{type === 'admin' || type === 'quarantine' ? (
				file.quarantine ? (
					<AllowFileButton uuid={file.uuid} />
				) : (
					<QuarantineFileButton uuid={file.uuid} />
				)
			) : null}
		</div>
	);
};

const AllowFileButton = ({ uuid }: { readonly uuid: string }) => {
	const setConfirmationDialog = useSetAtom(confirmationDialogAtom);
	const setIsDialogOpen = useSetAtom(isDialogOpenAtom);
	const { formAction, isPending, state } = useServerAction({
		action: allowFile,
		identifier: uuid
	});
	const queryClient = useQueryClient();

	useEffect(() => {
		if (state.type === MessageType.Success) {
			void queryClient.invalidateQueries({ queryKey: ['uploads'] });
			setIsDialogOpen(false);
		}
	}, [state.type, setIsDialogOpen, queryClient]);

	return (
		<Tooltip content="Unquarantine file">
			<button
				type="button"
				disabled={isPending}
				className={buttonVariants({ variant: 'ghost', size: 'icon' })}
				onClick={() =>
					setConfirmationDialog({
						callback: () => formAction(),
						description:
							'This action will remove the file from quarantine and allow anyone with a link to access it.'
					})
				}
			>
				<CircleSlashIcon className="h-5 w-5" />
			</button>
		</Tooltip>
	);
};

const QuarantineFileButton = ({ uuid }: { readonly uuid: string }) => {
	const setConfirmationDialog = useSetAtom(confirmationDialogAtom);
	const setIsDialogOpen = useSetAtom(isDialogOpenAtom);
	const { formAction, isPending, state } = useServerAction({
		action: quarantineFile,
		identifier: uuid
	});
	const queryClient = useQueryClient();

	useEffect(() => {
		if (state.type === MessageType.Success) {
			void queryClient.invalidateQueries({ queryKey: ['uploads'] });
			setIsDialogOpen(false);
		}
	}, [state.type, setIsDialogOpen, queryClient]);

	return (
		<Tooltip content="Quarantine file">
			<button
				type="button"
				disabled={isPending}
				className={buttonVariants({ variant: 'ghost', size: 'icon' })}
				onClick={() => {
					setConfirmationDialog({
						callback: () => formAction(),
						description: 'This action will quarantine the file and prevent anyone else from accessing it.'
					});
				}}
			>
				<BanIcon className="h-5 w-5" />
			</button>
		</Tooltip>
	);
};

const DeleteFileButton = ({ uuid, type }: { readonly type?: FilePropsType; readonly uuid: string }) => {
	const setConfirmationDialog = useSetAtom(confirmationDialogAtom);
	const setIsDialogOpen = useSetAtom(isDialogOpenAtom);
	const { formAction, isPending, state } = useServerAction({
		action: type === 'admin' ? deleteFileAsAdmin : deleteFile,
		identifier: uuid
	});
	const queryClient = useQueryClient();

	useEffect(() => {
		if (state.type === MessageType.Success) {
			void queryClient.invalidateQueries({ queryKey: ['uploads'] });
			setIsDialogOpen(false);
		}
	}, [state.type, setIsDialogOpen, queryClient]);

	return (
		<Tooltip content="Delete file">
			<button
				type="button"
				disabled={isPending}
				className={buttonVariants({ variant: 'ghost', size: 'icon' })}
				onClick={() =>
					setConfirmationDialog({
						callback: () => formAction(),
						description: 'Are you sure you want to delete this file?'
					})
				}
			>
				<Trash2Icon className="h-5 w-5" />
			</button>
		</Tooltip>
	);
};
