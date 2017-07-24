//
//  AtlassianURLConnectionDelegate.m
//  AtlassianSketchFramework
//
//  Created by Tim Pettersen on 7/21/17.
//  Copyright © 2017 Atlassian. All rights reserved.
//

#import "AtlassianURLConnectionDelegate.h"

@interface AtlassianURLConnectionDelegate ()

@property (readwrite, atomic, strong) NSProgress * progress;
@property (readwrite, atomic, strong) NSError * error;
@property (readwrite, atomic, strong) NSURLResponse * response;
@property (readwrite, atomic, strong) NSMutableData * data;
@property (readwrite, atomic) bool completed;
@property (readwrite, atomic) bool failed;

@end

@implementation AtlassianURLConnectionDelegate

- (instancetype)init
{
    self = [super init];
    self.progress = [[NSProgress alloc] initWithParent:[NSProgress currentProgress] userInfo:nil];
    return self;
}

- (void)connection:(NSURLConnection __unused *)connection
   didSendBodyData:(NSInteger)bytesWritten
 totalBytesWritten:(NSInteger)totalBytesWritten
totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite
{
    NSProgress *progress = self.progress;
    progress.totalUnitCount = totalBytesExpectedToWrite;
    progress.completedUnitCount = totalBytesWritten;
}

- (void)connection:(NSURLConnection __unused *)connection
didReceiveResponse:(NSURLResponse *)response
{
    self.response = response;
    self.data = [[ NSMutableData alloc ] init ];
}

- (void)connection:(NSURLConnection __unused *)connection
    didReceiveData:(NSData *)data
{
    [ self.data appendData:data ];
}

- (void)connectionDidFinishLoading:(NSURLConnection __unused *)connection
{
    self.completed = YES;
}

- (void)connection:(NSURLConnection __unused *)connection
  didFailWithError:(NSError *)error
{
    self.error = error;
    self.failed = YES;
}

@end
